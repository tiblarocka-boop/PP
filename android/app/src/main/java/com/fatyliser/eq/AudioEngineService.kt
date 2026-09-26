package com.fatyliser.eq

import android.app.*
import android.content.Intent
import android.media.audiofx.DynamicsProcessing
import android.os.Binder
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import kotlinx.coroutines.*
import java.io.BufferedReader
import java.io.InputStreamReader

class AudioEngineService : Service() {

    private val binder = LocalBinder()
    private val effectsMap = HashMap<Int, DynamicsProcessing>()
    private val serviceScope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val BAND_COUNT = 32
    private val bandGains = FloatArray(BAND_COUNT) { 0.0f }

    inner class LocalBinder : Binder() {
        fun getService(): AudioEngineService = this@AudioEngineService
    }

    override fun onBind(intent: Intent?): IBinder = binder

    override fun onCreate() {
        super.onCreate()
        startForeground(1, createNotification())
        startTrackingYouTube()
    }

    private fun startTrackingYouTube() {
        serviceScope.launch {
            while (isActive) {
                val sessionIds = scrapeYouTubeSessions()
                withContext(Dispatchers.Main) {
                    sessionIds.forEach { id -> applyEqualizerToSession(id) }
                }
                delay(2000)
            }
        }
    }

    private fun scrapeYouTubeSessions(): List<Int> {
        val sessions = mutableListOf<Int>()
        try {
            val process = Runtime.getRuntime().exec("dumpsys media.audio_flinger")
            val reader = BufferedReader(InputStreamReader(process.inputStream))
            var line: String?
            val sessionPattern = Regex("""Session\s+(\d+)""")

            while (reader.readLine().also { line = it } != null) {
                if (line!!.contains("com.google.android.youtube") || line!!.contains("youtube")) {
                    sessionPattern.find(line!)?.let { match ->
                        sessions.add(match.groupValues[1].toInt())
                    }
                }
            }
            reader.close()
        } catch (e: Exception) { e.printStackTrace() }
        return sessions
    }

    private fun applyEqualizerToSession(sessionId: Int) {
        if (effectsMap.containsKey(sessionId)) return
        try {
            // Using the correct, official native variant constant integer (0)
            val builder = DynamicsProcessing.Config.Builder(
                DynamicsProcessing.VARIANT_FAVOR_FREQUENCY_RESOLUTION,
                2, true, BAND_COUNT, false, 0, false, 0, true
            )
            val effect = DynamicsProcessing(0, sessionId, builder.build())
            effect.enabled = true
            
            for (i in 0 until BAND_COUNT) {
                try {
                    val eqBand = effect.getPreEqBandByChannelIndex(0, i)
                    eqBand.gain = bandGains[i]
                } catch (e: Exception) { e.printStackTrace() }
            }
            effectsMap[sessionId] = effect
        } catch (e: Exception) { e.printStackTrace() }
    }

    fun updateBandGain(bandIndex: Int, gainDb: Float) {
        if (bandIndex in 0 until BAND_COUNT) {
            bandGains[bandIndex] = gainDb
            effectsMap.values.forEach { effect ->
                try {
                    val eqBand = effect.getPreEqBandByChannelIndex(0, bandIndex)
                    eqBand.gain = gainDb
                } catch (e: Exception) { e.printStackTrace() }
            }
        }
    }

    private fun createNotification(): Notification {
        val channelId = "FatyliserChannel"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(channelId, "Fatyliser Processing", NotificationManager.IMPORTANCE_LOW)
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
        return NotificationCompat.Builder(this, channelId)
            .setContentTitle("Fatyliser Engine Running")
            .setContentText("Processing system media in the background...")
            .setSmallIcon(android.R.drawable.ic_media_play)
            .build()
    }

    override fun onDestroy() {
        serviceScope.cancel()
        effectsMap.values.forEach { it.enabled = false; it.release() }
        effectsMap.clear()
        super.onDestroy()
    }
}
