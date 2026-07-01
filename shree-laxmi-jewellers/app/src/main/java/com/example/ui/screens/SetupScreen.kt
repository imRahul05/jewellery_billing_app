package com.example.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.example.data.room.StoreConfig
import com.example.viewmodel.ErpViewModel
import com.example.data.DemoDataGenerator
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SetupScreen(viewModel: ErpViewModel, onComplete: () -> Unit) {
    var businessName by remember { mutableStateOf("") }
    var ownerName by remember { mutableStateOf("") }
    var gst by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()

    Scaffold(
        topBar = { TopAppBar(title = { Text("Welcome to Jewellery ERP") }) }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text("Business Setup", style = MaterialTheme.typography.headlineMedium)
            
            OutlinedTextField(
                value = businessName,
                onValueChange = { businessName = it },
                label = { Text("Business Name") },
                modifier = Modifier.fillMaxWidth()
            )
            
            OutlinedTextField(
                value = ownerName,
                onValueChange = { ownerName = it },
                label = { Text("Owner Name") },
                modifier = Modifier.fillMaxWidth()
            )
            
            OutlinedTextField(
                value = gst,
                onValueChange = { gst = it },
                label = { Text("GST Number") },
                modifier = Modifier.fillMaxWidth()
            )

            Button(
                onClick = {
                    if (businessName.isNotBlank()) {
                        val config = StoreConfig(
                            id = 1,
                            businessName = businessName,
                            ownerName = ownerName,
                            gstNumber = gst,
                            phone = "",
                            isSetupComplete = true
                        )
                        viewModel.saveStoreConfig(config)
                        scope.launch {
                            // Demo data is populated here if they skip actual empty state
                            onComplete()
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Finish Setup")
            }
            
            Spacer(modifier = Modifier.height(32.dp))
            
            Button(
                onClick = {
                    scope.launch {
                        DemoDataGenerator.generate(viewModel.javaClass.getDeclaredField("repository").apply { isAccessible = true }.get(viewModel) as com.example.data.repository.ErpRepository)
                        onComplete()
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.secondary),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Auto-Fill Demo Data & Skip")
            }
        }
    }
}
