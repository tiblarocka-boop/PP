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
    private val sliderStates = mutableStateListOf<Float>().apply { repeat(32) { add(0f) } }

    private val connection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
            val binder = service as AudioEngineService.AudioEngineBinder
            val s = binder.getService()
            audioEngineService = s
            isBound = true
            activeSessions = s.getActiveSessionCount()
            val currentGains = s.getBandGains()
            for (i in 0 until 32) { if (i < currentGains.size) sliderStates[i] = currentGains[i] }
        }
        override fun onServiceDisconnected(name: ComponentName?) { isBound = false }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val intent = Intent(this, AudioEngineService::class.java)
        startService(intent)
        bindService(intent, connection, Context.BIND_AUTO_CREATE)

        setContent {
            MaterialTheme(
                colorScheme = darkColorScheme(
                    background = Color(0xFF0F121A), // Deep Slate Blue
                    surface = Color(0xFF171C28),    // Matte Card Navy
                    primary = Color(0xFF00FFB2),    // Neon Mint Accent
                    secondary = Color(0xFF8A99AD)   // Soft Muted Text
                )
            ) {
                Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                    Column(modifier = Modifier.fillMaxSize().padding(20.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        
                        Text(
                            text = "FATYLISER AUDIO",
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Black,
                            letterSpacing = 2.sp,
                            color = Color.White,
                            modifier = Modifier.padding(top = 16.dp, bottom = 4.dp)
                        )
                        Text(
                            text = "PRO AUDIO EQUALIZER ARCHITECTURE",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary,
                            letterSpacing = 1.sp,
                            modifier = Modifier.padding(bottom = 16.dp)
                        )
                        
                        Card(
                            modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            shape = RoundedCornerShape(16.dp),
                            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth().padding(20.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text("SIGNAL ROUTING ENGINE", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.secondary)
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text(if (isBound) "LINKED & TRACKING" else "INITIALIZING...", fontWeight = FontWeight.Bold, fontSize = 15.sp, color = Color.White)
                                }
                                Box(
                                    modifier = Modifier
                                        .background(if (isBound) Color(0x1A00FFB2) else Color(0x1AFF5252), RoundedCornerShape(20.dp))
                                        .padding(horizontal = 14.dp, vertical = 6.dp)
                                ) {
                                    Text(
                                        text = "$activeSessions FEEDSTREAM${if(activeSessions != 1) "S" else ""}",
                                        color = if (isBound) MaterialTheme.colorScheme.primary else Color(0xFFFF5252),
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.ExtraBold
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        LazyVerticalGrid(
                            columns = GridCells.Adaptive(minSize = 78.dp),
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(bottom = 16.dp),
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(32) { index ->
                                val label = if (index < AudioEngineService.FREQUENCIES.size) AudioEngineService.FREQUENCIES[index] else "B${index + 1}"
                                
                                Column(
                                    horizontalAlignment = Alignment.CenterHorizontally,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(14.dp))
                                        .padding(vertical = 12.dp, horizontal = 6.dp)
                                ) {
                                    Text(text = label, fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                    Spacer(modifier = Modifier.height(2.dp))
                                    
                                    Slider(
                                        value = sliderStates[index],
                                        onValueChange = { targetVal ->
                                            sliderStates[index] = targetVal
                                            if (isBound) audioEngineService?.updateBandGain(index, targetVal)
                                        },
                                        valueRange = -12f..12f,
                                        colors = SliderDefaults.colors(
                                            thumbColor = MaterialTheme.colorScheme.primary,
                                            activeTrackColor = MaterialTheme.colorScheme.primary,
                                            inactiveTrackColor = Color(0xFF252E42)
                                        ),
                                        modifier = Modifier.width(68.dp)
                                    )
                                    
                                    Text(
                                        text = "${if(sliderStates[index] > 0) "+" else ""}${sliderStates[index].toInt()} dB",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = if (sliderStates[index] != 0f) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.secondary
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        audioEngineService?.let { activeSessions = it.getActiveSessionCount() }
    }

    override fun onDestroy() {
        super.onDestroy()
        if (isBound) { unbindService(connection); isBound = false }
    }
}
