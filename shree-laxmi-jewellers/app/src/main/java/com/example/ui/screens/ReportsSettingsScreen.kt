package com.example.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.example.viewmodel.ErpViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReportsScreen(viewModel: ErpViewModel, navController: NavController) {
    val bills by viewModel.allBills.collectAsState()
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Sales Reports") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        LazyColumn(modifier = Modifier.padding(padding).fillMaxSize()) {
            items(bills) { b ->
                ListItem(
                    headlineContent = { Text("Bill #${b.id} - ${b.customerName}") },
                    supportingContent = { Text("${b.paymentMethod} | ${b.customerMobile}") },
                    trailingContent = { Text("₹${b.totalAmount}", style = MaterialTheme.typography.titleMedium) }
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(viewModel: ErpViewModel, navController: NavController) {
    val config by viewModel.storeConfig.collectAsState()
    
    var goldRate by androidx.compose.runtime.remember(config) { androidx.compose.runtime.mutableStateOf(config?.goldRate?.toString() ?: "5842.0") }
    var silverRate by androidx.compose.runtime.remember(config) { androidx.compose.runtime.mutableStateOf(config?.silverRate?.toString() ?: "74.5") }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Settings") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(modifier = Modifier.padding(padding).padding(16.dp)) {
            Text("Business Information", style = MaterialTheme.typography.titleMedium)
            Spacer(modifier = Modifier.height(16.dp))
            OutlinedTextField(
                value = config?.businessName ?: "",
                onValueChange = {},
                label = { Text("Business Name") },
                modifier = Modifier.fillMaxWidth(),
                readOnly = true
            )
            Spacer(modifier = Modifier.height(8.dp))
            OutlinedTextField(
                value = config?.gstNumber ?: "",
                onValueChange = {},
                label = { Text("GST Number") },
                modifier = Modifier.fillMaxWidth(),
                readOnly = true
            )
            
            Spacer(modifier = Modifier.height(24.dp))
            Text("Market Rates", style = MaterialTheme.typography.titleMedium)
            Spacer(modifier = Modifier.height(16.dp))
            OutlinedTextField(
                value = goldRate,
                onValueChange = { goldRate = it },
                label = { Text("Gold Rate (22K) per gram") },
                keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = androidx.compose.ui.text.input.KeyboardType.Decimal),
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(modifier = Modifier.height(8.dp))
            OutlinedTextField(
                value = silverRate,
                onValueChange = { silverRate = it },
                label = { Text("Silver Rate per gram") },
                keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = androidx.compose.ui.text.input.KeyboardType.Decimal),
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(modifier = Modifier.height(16.dp))
            Button(
                onClick = {
                    config?.let {
                        viewModel.saveStoreConfig(it.copy(
                            goldRate = goldRate.toDoubleOrNull() ?: it.goldRate,
                            silverRate = silverRate.toDoubleOrNull() ?: it.silverRate
                        ))
                    }
                },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Save Rates")
            }
        }
    }
}
