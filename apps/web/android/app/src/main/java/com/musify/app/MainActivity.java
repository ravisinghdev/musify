package com.musify.app;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

import java.lang.ref.WeakReference;

public class MainActivity extends BridgeActivity {

    private static WeakReference<MainActivity> instanceRef;

    public static void deliverNativeControlAction(final String action) {
        if (instanceRef != null) {
            final MainActivity activity = instanceRef.get();
            if (activity != null) {
                activity.runOnUiThread(() -> {
                    try {
                        WebView webView = activity.getBridge() != null ? activity.getBridge().getWebView() : null;
                        if (webView != null) {
                            String js = "window.dispatchEvent(new CustomEvent('musify-native-control', { detail: { action: '" + action + "' } }));";
                            webView.evaluateJavascript(js, null);
                        }
                    } catch (Exception ignored) {}
                });
            }
        }
    }

    public class MusifyNativeBridge {
        @JavascriptInterface
        public void updatePlayback(final String title, final String artist, final String artworkUrl, final boolean isPlaying) {
            runOnUiThread(() -> {
                try {
                    Intent serviceIntent = new Intent(MainActivity.this, MusifyPlaybackService.class);
                    serviceIntent.setAction(MusifyPlaybackService.ACTION_UPDATE_PLAYBACK);
                    serviceIntent.putExtra(MusifyPlaybackService.EXTRA_TITLE, title);
                    serviceIntent.putExtra(MusifyPlaybackService.EXTRA_ARTIST, artist);
                    serviceIntent.putExtra(MusifyPlaybackService.EXTRA_ARTWORK_URL, artworkUrl);
                    serviceIntent.putExtra(MusifyPlaybackService.EXTRA_IS_PLAYING, isPlaying);

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        startForegroundService(serviceIntent);
                    } else {
                        startService(serviceIntent);
                    }
                } catch (Exception ignored) {}
            });
        }

        @JavascriptInterface
        public void stopPlayback() {
            runOnUiThread(() -> {
                try {
                    Intent serviceIntent = new Intent(MainActivity.this, MusifyPlaybackService.class);
                    serviceIntent.setAction(MusifyPlaybackService.ACTION_STOP);
                    startService(serviceIntent);
                } catch (Exception ignored) {}
            });
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        instanceRef = new WeakReference<>(this);

        try {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                WebSettings settings = webView.getSettings();
                settings.setDomStorageEnabled(true);
                settings.setDatabaseEnabled(true);
                settings.setMediaPlaybackRequiresUserGesture(false);
                settings.setCacheMode(WebSettings.LOAD_DEFAULT);
                webView.setLayerType(WebView.LAYER_TYPE_HARDWARE, null);

                // Inject MusifyNativeBridge
                webView.addJavascriptInterface(new MusifyNativeBridge(), "MusifyNativeBridge");
            }
        } catch (Exception ignored) {}
    }

    @Override
    public void onPause() {
        super.onPause();
        // Keep timers running so background audio and YouTube playback do not freeze
        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().resumeTimers();
            }
        } catch (Exception ignored) {}
    }

    @Override
    public void onResume() {
        super.onResume();
        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().resumeTimers();
            }
        } catch (Exception ignored) {}
    }

    @Override
    public void onDestroy() {
        if (instanceRef != null && instanceRef.get() == this) {
            instanceRef = null;
        }
        super.onDestroy();
    }
}
