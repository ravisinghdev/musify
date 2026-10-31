package com.musify.app;

import android.content.Context;
import android.util.AttributeSet;
import android.view.View;
import com.getcapacitor.CapacitorWebView;

public class MusifyWebView extends CapacitorWebView {

    public MusifyWebView(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    @Override
    protected void onWindowVisibilityChanged(int visibility) {
        // Chromium pauses all HTML5/iframe audio/video decoders when visibility != View.VISIBLE.
        // Force the underlying Chromium engine to treat window as ALWAYS VISIBLE so playback continues in background.
        super.onWindowVisibilityChanged(View.VISIBLE);
    }

    @Override
    public void dispatchWindowVisibilityChanged(int visibility) {
        super.dispatchWindowVisibilityChanged(View.VISIBLE);
    }

    @Override
    protected void onVisibilityChanged(View changedView, int visibility) {
        super.onVisibilityChanged(changedView, View.VISIBLE);
    }

    @Override
    public int getWindowVisibility() {
        return View.VISIBLE;
    }

    @Override
    public int getVisibility() {
        return View.VISIBLE;
    }

    @Override
    public boolean hasWindowFocus() {
        return true;
    }
}


