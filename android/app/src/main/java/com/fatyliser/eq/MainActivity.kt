package com.fatyliser.eq

import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.os.Bundle
import android.os.IBinder
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

class MainActivity : ComponentActivity() {
    private var audioEngineService: AudioEngineService? = null
    private var isBound by mutableStateOf(false)
    private var activeSessions by mutableStateOf(0)
    private val sliderStates = mutableStateListOf<Float>().apply {
        repeat(32) { add(0f) }
    }

    private val connection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
            val binder = service as AudioEngineService.AudioEngineBinder
            val s = binder.getService()
            audioEngineService = s
            isBound = true
            activeSessions = s.getActiveSessionCount()
            
            val currentGains = s.getBandGains()
            for (i in 0 until 32) {
                if (i < currentGains.size) {
                    sliderStates[i] = currentGains[i]
                }
            }
        }
        override fun onServiceDisconnected(name: ComponentName?) {
            isBound = false
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        val intent = Intent(this, AudioEngineService::class.java)
        startService(intent)
        bindService(intent, connection, Context.BIND_AUTO_CREATE)

        setContent {
            // Force a sleek AMOLED Dark theme baseline configuration
            MaterialTheme(
                colorScheme = darkColorScheme(
                    background = Color(0xFF121212),
                    surface = Color(0xFF1E1E1E),
                    primary = Color(0xFF00E676),
                    secondary = Color(0xFFB0BEC5)
                )
            ) {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "🎚️ Fatyliser Equalizer",
                            fontSize = 26.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = Color.White,
                            modifier = Modifier.padding(vertical = 16.dp)
                        )
                        
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 8.dp),
                            colors = CardDefaults.cardColors(containerColor = Color(0xFF1E1E1E)),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(16.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("Engine Status:", fontWeight = FontWeight.Bold, color = Color.White)
                                Text(
                                    text = if (isBound) "Active Tracking ($activeSessions sessions)" else "Connecting...",
                                    fontWeight = FontWeight.Bold,
                                    color = if (isBound) Color(0xFF00E676) else Color(0xFFFF5252)
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        LazyVerticalGrid(
                            columns = GridCells.Adaptive(minSize = 80.dp),
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(4.dp),
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                            verticalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            items(32) { index ->
                                val label = if (index < AudioEngineService.FREQUENCIES.size) {
                                    AudioEngineService.FREQUENCIES[index]
                                } else {
                                    "B${index + 1}"
                                }

                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(Color(0xFF1E1E1E), RoundedCornerShape(8.dp))
                                        .padding(8.dp)
                                ) {
                                    Text(
                                        text = label,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.secondary
                                    )
                                    
                                    Slider(
                                        value = sliderStates[index],
                                        onValueChange = { targetVal ->
                                            sliderStates[index] = targetVal
                                            if (isBound) {
                                                audioEngineService?.updateBandGain(index, targetVal)
                                            }
                                        },
                                        valueRange = -12f..12f,
                                        colors = SliderDefaults.colors(
                                            thumbColor = Color(0xFF00E676),
                                            activeTrackColor = Color(0xFF00E676),
                                            inactiveTrackColor = Color(0xFF37474F)
                                        ),
                                        modifier = Modifier.width(70.dp)
                                    )
                                    
                                    Text(
                                        text = "${sliderStates[index].toInt()} dB",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Medium,
                                        color = if (sliderStates[index] != 0f) Color(0xFF00E676) else Color.Gray
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    override fun onPostResume() {
        super.onResume()
        audioEngineService?.let {
            activeSessions = it.getActiveSessionCount()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        if (isBound) {
            unbindService(connection)
            isBound = false
        }
    }
}
