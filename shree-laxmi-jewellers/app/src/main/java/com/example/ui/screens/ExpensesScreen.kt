package com.example.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.example.viewmodel.ErpViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExpensesScreen(viewModel: ErpViewModel, navController: NavController) {
    val expenses by viewModel.allExpenses.collectAsState()
    val total by viewModel.totalExpenses.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Expenses (Total: ₹${total ?: 0.0})") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = { /* Add expense logic */ }) {
                Icon(Icons.Default.Add, contentDescription = "Add Expense")
            }
        }
    ) { padding ->
        LazyColumn(modifier = Modifier.padding(padding).fillMaxSize()) {
            items(expenses) { e ->
                ListItem(
                    headlineContent = { Text(e.category) },
                    supportingContent = { Text(e.notes) },
                    trailingContent = { Text("₹${e.amount}", style = MaterialTheme.typography.titleMedium) }
                )
            }
        }
    }
}
