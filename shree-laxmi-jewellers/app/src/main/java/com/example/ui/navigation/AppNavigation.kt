package com.example.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.example.viewmodel.ErpViewModel
import com.example.ui.screens.*

@Composable
fun AppNavigation(viewModel: ErpViewModel) {
    val navController = rememberNavController()
    val config by viewModel.storeConfig.collectAsState()

    val startDestination = if (config?.isSetupComplete == true) "dashboard" else "setup"

    NavHost(navController = navController, startDestination = startDestination) {
        composable("setup") {
            SetupScreen(viewModel) {
                navController.navigate("dashboard") {
                    popUpTo("setup") { inclusive = true }
                }
            }
        }
        composable("dashboard") {
            DashboardScreen(viewModel, navController)
        }
        composable("billing") {
            BillingScreen(viewModel, navController)
        }
        composable("customers") {
            CustomersScreen(viewModel, navController)
        }
        composable("inventory") {
            InventoryScreen(viewModel, navController)
        }
        composable("expenses") {
            ExpensesScreen(viewModel, navController)
        }
        composable("reports") {
            ReportsScreen(viewModel, navController)
        }
        composable("settings") {
            SettingsScreen(viewModel, navController)
        }
    }
}
