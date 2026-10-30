package com.musify.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.support.v4.media.MediaMetadataCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;

import androidx.core.app.NotificationCompat;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class MusifyPlaybackService extends Service implements AudioManager.OnAudioFocusChangeListener {

    public static final String ACTION_UPDATE_PLAYBACK = "com.musify.app.action.UPDATE_PLAYBACK";
    public static final String ACTION_PLAY = "com.musify.app.action.PLAY";
    public static final String ACTION_PAUSE = "com.musify.app.action.PAUSE";
    public static final String ACTION_PREV = "com.musify.app.action.PREV";
    public static final String ACTION_NEXT = "com.musify.app.action.NEXT";
    public static final String ACTION_STOP = "com.musify.app.action.STOP";

    public static final String EXTRA_TITLE = "extra_title";
    public static final String EXTRA_ARTIST = "extra_artist";
    public static final String EXTRA_ARTWORK_URL = "extra_artwork_url";
    public static final String EXTRA_IS_PLAYING = "extra_is_playing";

    private static final String CHANNEL_ID = "musify_audio_playback_channel";
    private static final int NOTIFICATION_ID = 1001;

    private MediaSessionCompat mediaSession;
    private PowerManager.WakeLock wakeLock;
    private WifiManager.WifiLock wifiLock;
    private AudioManager audioManager;
    private AudioFocusRequest audioFocusRequest;

    private String currentTitle = "Musify";
    private String currentArtist = "Playing Music";
    private String currentArtworkUrl = null;
    private boolean isPlaying = false;
    private Bitmap cachedArtworkBitmap = null;

    private final BroadcastReceiver noisyReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (AudioManager.ACTION_AUDIO_BECOMING_NOISY.equals(intent.getAction())) {
                sendControlActionToApp("pause");
            }
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();

        audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        createNotificationChannel();

        // 1. WakeLock & WifiLock so streaming does not sleep when screen locks
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (pm != null) {
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "musify:playback_wakelock");
            wakeLock.setReferenceCounted(false);
            try {
                wakeLock.acquire(12 * 60 * 60 * 1000L); // max 12 hours
            } catch (Exception ignored) {}
        }

        WifiManager wm = (WifiManager) getApplicationContext().getSystemService(Context.WIFI_SERVICE);
        if (wm != null) {
            wifiLock = wm.createWifiLock(WifiManager.WIFI_MODE_FULL_HIGH_PERF, "musify:wifi_lock");
            wifiLock.setReferenceCounted(false);
            try {
                wifiLock.acquire();
            } catch (Exception ignored) {}
        }

        // 2. Initialize MediaSessionCompat for Lock Screen & Bluetooth Headset controls
        mediaSession = new MediaSessionCompat(this, "MusifyMediaSession");
        mediaSession.setCallback(new MediaSessionCompat.Callback() {
            @Override
            public void onPlay() {
                sendControlActionToApp("play");
            }

            @Override
            public void onPause() {
                sendControlActionToApp("pause");
            }

            @Override
            public void onSkipToNext() {
                sendControlActionToApp("next");
            }

            @Override
            public void onSkipToPrevious() {
                sendControlActionToApp("prev");
            }

            @Override
            public void onStop() {
                sendControlActionToApp("pause");
                stopForeground(true);
                stopSelf();
            }
        });
        mediaSession.setActive(true);

        // 3. Register Noisy Receiver for Headphone Unplug
        IntentFilter filter = new IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(noisyReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(noisyReceiver, filter);
        }

        requestAudioFocus();
    }

    private void requestAudioFocus() {
        if (audioManager == null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            AudioAttributes playbackAttributes = new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build();
            audioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                    .setAudioAttributes(playbackAttributes)
                    .setAcceptsDelayedFocusGain(true)
                    .setOnAudioFocusChangeListener(this)
                    .build();
            audioManager.requestAudioFocus(audioFocusRequest);
        } else {
            audioManager.requestAudioFocus(this, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN);
        }
    }

    @Override
    public void onAudioFocusChange(int focusChange) {
        switch (focusChange) {
            case AudioManager.AUDIOFOCUS_LOSS:
            case AudioManager.AUDIOFOCUS_LOSS_TRANSIENT:
                sendControlActionToApp("pause");
                break;
            case AudioManager.AUDIOFOCUS_GAIN:
                if (isPlaying) {
                    sendControlActionToApp("play");
                }
                break;
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) return START_STICKY;

        String action = intent.getAction();
        if (ACTION_UPDATE_PLAYBACK.equals(action)) {
            String title = intent.getStringExtra(EXTRA_TITLE);
            String artist = intent.getStringExtra(EXTRA_ARTIST);
            String artworkUrl = intent.getStringExtra(EXTRA_ARTWORK_URL);
            boolean playing = intent.getBooleanExtra(EXTRA_IS_PLAYING, true);

            if (title != null) currentTitle = title;
            if (artist != null) currentArtist = artist;
            isPlaying = playing;

            // Immediately satisfy Android's 5-second startForeground mandate
            buildAndShowNotification();

            if (artworkUrl != null && !artworkUrl.equals(currentArtworkUrl)) {
                currentArtworkUrl = artworkUrl;
                loadArtworkAsync(artworkUrl);
            }
        } else if (ACTION_PLAY.equals(action)) {
            sendControlActionToApp("play");
        } else if (ACTION_PAUSE.equals(action)) {
            sendControlActionToApp("pause");
        } else if (ACTION_NEXT.equals(action)) {
            sendControlActionToApp("next");
        } else if (ACTION_PREV.equals(action)) {
            sendControlActionToApp("prev");
        } else if (ACTION_STOP.equals(action)) {
            sendControlActionToApp("pause");
            stopForeground(true);
            stopSelf();
        }

        return START_STICKY;
    }

    private void loadArtworkAsync(final String urlString) {
        new Thread(() -> {
            try {
                URL url = new URL(urlString);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setDoInput(true);
                conn.setConnectTimeout(4000);
                conn.setReadTimeout(4000);
                conn.connect();
                InputStream input = conn.getInputStream();
                cachedArtworkBitmap = BitmapFactory.decodeStream(input);
            } catch (Exception e) {
                cachedArtworkBitmap = null;
            }
            buildAndShowNotification();
        }).start();
    }

    private void buildAndShowNotification() {
        Intent launchIntent = new Intent(this, MainActivity.class);
        launchIntent.setAction(Intent.ACTION_MAIN);
        launchIntent.addCategory(Intent.CATEGORY_LAUNCHER);
        launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent contentPendingIntent = PendingIntent.getActivity(
                this, 0, launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        PendingIntent prevPendingIntent = PendingIntent.getService(
                this, 1, new Intent(this, MusifyPlaybackService.class).setAction(ACTION_PREV),
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        PendingIntent togglePlayIntent = PendingIntent.getService(
                this, 2, new Intent(this, MusifyPlaybackService.class).setAction(isPlaying ? ACTION_PAUSE : ACTION_PLAY),
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        PendingIntent nextPendingIntent = PendingIntent.getService(
                this, 3, new Intent(this, MusifyPlaybackService.class).setAction(ACTION_NEXT),
                PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0)
        );

        // Update MediaSession state
        PlaybackStateCompat.Builder stateBuilder = new PlaybackStateCompat.Builder()
                .setActions(PlaybackStateCompat.ACTION_PLAY | PlaybackStateCompat.ACTION_PAUSE |
                        PlaybackStateCompat.ACTION_SKIP_TO_NEXT | PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS |
                        PlaybackStateCompat.ACTION_STOP)
                .setState(isPlaying ? PlaybackStateCompat.STATE_PLAYING : PlaybackStateCompat.STATE_PAUSED,
                        PlaybackStateCompat.PLAYBACK_POSITION_UNKNOWN, 1.0f);
        mediaSession.setPlaybackState(stateBuilder.build());

        MediaMetadataCompat.Builder metaBuilder = new MediaMetadataCompat.Builder()
                .putString(MediaMetadataCompat.METADATA_KEY_TITLE, currentTitle)
                .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, currentArtist)
                .putString(MediaMetadataCompat.METADATA_KEY_ALBUM, "Musify");
        if (cachedArtworkBitmap != null) {
            metaBuilder.putBitmap(MediaMetadataCompat.METADATA_KEY_ALBUM_ART, cachedArtworkBitmap);
        }
        mediaSession.setMetadata(metaBuilder.build());

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(currentTitle)
                .setContentText(currentArtist)
                .setSubText("Musify")
                .setContentIntent(contentPendingIntent)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setOngoing(isPlaying)
                .setSilent(true)
                .setShowWhen(false)
                .setStyle(new androidx.media.app.NotificationCompat.MediaStyle()
                        .setMediaSession(mediaSession.getSessionToken())
                        .setShowActionsInCompactView(0, 1, 2));

        if (cachedArtworkBitmap != null) {
            builder.setLargeIcon(cachedArtworkBitmap);
        }

        builder.addAction(android.R.drawable.ic_media_previous, "Previous", prevPendingIntent);
        if (isPlaying) {
            builder.addAction(android.R.drawable.ic_media_pause, "Pause", togglePlayIntent);
        } else {
            builder.addAction(android.R.drawable.ic_media_play, "Play", togglePlayIntent);
        }
        builder.addAction(android.R.drawable.ic_media_next, "Next", nextPendingIntent);

        Notification notification = builder.build();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
    }

    private void sendControlActionToApp(String action) {
        MainActivity.deliverNativeControlAction(action);
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Musify Playback",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Shows media playback controls on lock screen and notification shade");
            channel.setShowBadge(false);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) {
                nm.createNotificationChannel(channel);
            }
        }
    }

    @Override
    public void onDestroy() {
        try {
            unregisterReceiver(noisyReceiver);
        } catch (Exception ignored) {}

        if (wakeLock != null && wakeLock.isHeld()) {
            try { wakeLock.release(); } catch (Exception ignored) {}
        }
        if (wifiLock != null && wifiLock.isHeld()) {
            try { wifiLock.release(); } catch (Exception ignored) {}
        }
        if (mediaSession != null) {
            mediaSession.setActive(false);
            mediaSession.release();
        }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}

