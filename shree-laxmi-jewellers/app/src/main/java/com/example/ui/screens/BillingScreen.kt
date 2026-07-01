package com.example.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.example.data.room.Bill
import com.example.data.room.BillItem
import com.example.data.room.Customer
import com.example.data.room.Product
import com.example.viewmodel.ErpViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BillingScreen(viewModel: ErpViewModel, navController: NavController) {
    val customers by viewModel.allCustomers.collectAsState()
    val products by viewModel.allProducts.collectAsState()
    val config by viewModel.storeConfig.collectAsState()
    
    var currentStep by remember { mutableIntStateOf(1) }
    
    var selectedCustomer by remember { mutableStateOf<Customer?>(null) }
    var isNewCustomer by remember { mutableStateOf(false) }
    var newCustomerName by remember { mutableStateOf("") }
    var newCustomerMobile by remember { mutableStateOf("") }
    
    var showProductDialog by remember { mutableStateOf(false) }
    var showNewProductDialog by remember { mutableStateOf(false) }
    
    val selectedItems = remember { mutableStateListOf<BillItem>() }
    val selectedProducts = remember { mutableStateListOf<Product>() }
    
    var paymentMethod by remember { mutableStateOf("Cash") }
    
    val totalAmount = selectedItems.sumOf { it.price * it.quantity }

    Scaffold(
        topBar = {
            Column {
                TopAppBar(
                    title = { Text("New Invoice - Step $currentStep of 4") },
                    navigationIcon = {
                        IconButton(onClick = { 
                            if (currentStep > 1) currentStep-- else navController.popBackStack() 
                        }) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                        }
                    }
                )
                LinearProgressIndicator(
                    progress = { currentStep / 4f },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        bottomBar = {
            BottomAppBar {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Total: ₹$totalAmount", style = MaterialTheme.typography.titleLarge)
                    Button(onClick = {
                        if (currentStep < 4) {
                            if (currentStep == 1 && isNewCustomer && newCustomerName.isNotBlank()) {
                                val c = Customer(name = newCustomerName, mobile = newCustomerMobile)
                                selectedCustomer = c
                                viewModel.insertCustomer(c) // Save early or wait? Waiting is better but let's save
                            }
                            currentStep++
                        } else {
                            if (selectedItems.isNotEmpty()) {
                                val bill = Bill(
                                    customerName = selectedCustomer?.name ?: "Walk-in Customer",
                                    customerMobile = selectedCustomer?.mobile ?: "",
                                    totalAmount = totalAmount,
                                    paymentMethod = paymentMethod
                                )
                                val updatedProducts = selectedProducts.map { p -> 
                                    val qty = selectedItems.find { it.productName == p.name }?.quantity ?: 0
                                    p.copy(stock = p.stock - qty)
                                }
                                viewModel.createBill(bill, selectedItems, updatedProducts, selectedCustomer)
                                navController.popBackStack()
                            }
                        }
                    }) {
                        Text(if (currentStep < 4) "Next" else "Save Bill")
                    }
                }
            }
        }
    ) { padding ->
        Column(modifier = Modifier
            .padding(padding)
            .padding(16.dp)) {
            when (currentStep) {
                1 -> CustomerStep(
                    customers = customers,
                    selectedCustomer = selectedCustomer,
                    onCustomerSelect = { selectedCustomer = it; isNewCustomer = false },
                    isNewCustomer = isNewCustomer,
                    onNewCustomerToggle = { isNewCustomer = it },
                    newCustomerName = newCustomerName,
                    onNewCustomerNameChange = { newCustomerName = it },
                    newCustomerMobile = newCustomerMobile,
                    onNewCustomerMobileChange = { newCustomerMobile = it }
                )
                2 -> ProductsStep(
                    selectedItems = selectedItems,
                    onAddExistingClick = { showProductDialog = true },
                    onAddNewClick = { showNewProductDialog = true }
                )
                3 -> PaymentStep(
                    paymentMethod = paymentMethod,
                    onPaymentMethodChange = { paymentMethod = it }
                )
                4 -> PreviewStep(
                    customer = selectedCustomer ?: if (isNewCustomer) Customer(name = newCustomerName, mobile = newCustomerMobile) else Customer(name = "Walk-in", mobile = ""),
                    items = selectedItems,
                    total = totalAmount,
                    paymentMethod = paymentMethod
                )
            }
        }
        
        if (showProductDialog) {
            AlertDialog(
                onDismissRequest = { showProductDialog = false },
                title = { Text("Select Product") },
                text = {
                    LazyColumn {
                        items(products.filter { it.stock > 0 }) { p ->
                            ListItem(
                                headlineContent = { Text(p.name) },
                                supportingContent = { Text("Stock: ${p.stock} | ₹${p.price}") },
                                modifier = Modifier.clickable {
                                    selectedProducts.add(p)
                                    selectedItems.add(BillItem(billId = 0, productName = p.name, quantity = 1, price = p.price))
                                    showProductDialog = false
                                }
                            )
                        }
                    }
                },
                confirmButton = {
                    TextButton(onClick = { showProductDialog = false }) { Text("Cancel") }
                }
            )
        }

        if (showNewProductDialog) {
            var name by remember { mutableStateOf("") }
            var weight by remember { mutableStateOf("") }
            var makingCharge by remember { mutableStateOf("") }
            var isPercentage by remember { mutableStateOf(true) }
            var goldRate by remember(config) { mutableStateOf(config?.goldRate?.toString() ?: "5842.0") }
            var price by remember { mutableStateOf("") }

            LaunchedEffect(weight, makingCharge, isPercentage, goldRate) {
                val w = weight.toDoubleOrNull() ?: 0.0
                val mc = makingCharge.toDoubleOrNull() ?: 0.0
                val gr = goldRate.toDoubleOrNull() ?: 0.0
                
                if (w > 0 && gr > 0) {
                    val base = w * gr
                    val extra = if (isPercentage) base * (mc / 100) else mc
                    val final = base + extra
                    price = "%.2f".format(final)
                }
            }

            AlertDialog(
                onDismissRequest = { showNewProductDialog = false },
                title = { Text("Add Custom Product") },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Item Name") }, modifier = Modifier.fillMaxWidth())
                        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedTextField(value = weight, onValueChange = { weight = it }, label = { Text("Weight (g)") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal), modifier = Modifier.weight(1f))
                            OutlinedTextField(value = goldRate, onValueChange = { goldRate = it }, label = { Text("Gold Rate") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal), modifier = Modifier.weight(1f))
                        }
                        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            OutlinedTextField(value = makingCharge, onValueChange = { makingCharge = it }, label = { Text("Making Charge") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal), modifier = Modifier.weight(1f))
                            Button(onClick = { isPercentage = !isPercentage }, modifier = Modifier.weight(0.5f)) {
                                Text(if (isPercentage) "%" else "₹")
                            }
                        }
                        OutlinedTextField(value = price, onValueChange = { price = it }, label = { Text("Final Price (₹)") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal), modifier = Modifier.fillMaxWidth())
                    }
                },
                confirmButton = {
                    TextButton(onClick = {
                        val finalPrice = price.toDoubleOrNull() ?: 0.0
                        if (name.isNotBlank() && finalPrice > 0) {
                            val p = Product(name = name, category = "Custom", purity = "Custom", weight = weight.toDoubleOrNull() ?: 0.0, stock = 1, price = finalPrice)
                            viewModel.insertProduct(p)
                            selectedProducts.add(p)
                            selectedItems.add(BillItem(billId = 0, productName = p.name, quantity = 1, price = p.price))
                            showNewProductDialog = false
                        }
                    }) { Text("Add") }
                },
                dismissButton = {
                    TextButton(onClick = { showNewProductDialog = false }) { Text("Cancel") }
                }
            )
        }
    }
}

@Composable
fun CustomerStep(
    customers: List<Customer>,
    selectedCustomer: Customer?,
    onCustomerSelect: (Customer) -> Unit,
    isNewCustomer: Boolean,
    onNewCustomerToggle: (Boolean) -> Unit,
    newCustomerName: String,
    onNewCustomerNameChange: (String) -> Unit,
    newCustomerMobile: String,
    onNewCustomerMobileChange: (String) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text("Step 1: Select or Create Customer", style = MaterialTheme.typography.titleLarge)
        
        Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            FilterChip(selected = !isNewCustomer, onClick = { onNewCustomerToggle(false) }, label = { Text("Existing") })
            FilterChip(selected = isNewCustomer, onClick = { onNewCustomerToggle(true) }, label = { Text("New Customer") })
        }

        if (isNewCustomer) {
            OutlinedTextField(value = newCustomerName, onValueChange = onNewCustomerNameChange, label = { Text("Customer Name") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = newCustomerMobile, onValueChange = onNewCustomerMobileChange, label = { Text("Mobile Number") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone), modifier = Modifier.fillMaxWidth())
        } else {
            LazyColumn(modifier = Modifier.fillMaxHeight(0.7f)) {
                items(customers) { c ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp)
                            .clickable { onCustomerSelect(c) },
                        colors = CardDefaults.cardColors(
                            containerColor = if (selectedCustomer == c) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surface
                        ),
                        border = if (selectedCustomer == c) androidx.compose.foundation.BorderStroke(2.dp, MaterialTheme.colorScheme.primary) else null
                    ) {
                        PaddingValues(16.dp)
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(c.name, style = MaterialTheme.typography.titleMedium)
                            Text(c.mobile, style = MaterialTheme.typography.bodyMedium)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ProductsStep(
    selectedItems: List<BillItem>,
    onAddExistingClick: () -> Unit,
    onAddNewClick: () -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text("Step 2: Add Products", style = MaterialTheme.typography.titleLarge)
        Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            Button(onClick = onAddExistingClick, modifier = Modifier.weight(1f)) {
                Text("From Inventory")
            }
            Button(onClick = onAddNewClick, modifier = Modifier.weight(1f)) {
                Text("Custom Item")
            }
        }
        
        LazyColumn {
            items(selectedItems) { item ->
                ListItem(
                    headlineContent = { Text(item.productName) },
                    trailingContent = { Text("₹${item.price} x ${item.quantity}") }
                )
                HorizontalDivider()
            }
        }
    }
}

@Composable
fun PaymentStep(paymentMethod: String, onPaymentMethodChange: (String) -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text("Step 3: Payment Details", style = MaterialTheme.typography.titleLarge)
        listOf("Cash", "UPI", "Card", "Credit").forEach { method ->
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier
                .fillMaxWidth()
                .clickable { onPaymentMethodChange(method) }
                .padding(vertical = 8.dp)) {
                RadioButton(selected = paymentMethod == method, onClick = { onPaymentMethodChange(method) })
                Spacer(modifier = Modifier.width(8.dp))
                Text(method, style = MaterialTheme.typography.bodyLarge)
            }
        }
    }
}

@Composable
fun PreviewStep(customer: Customer, items: List<BillItem>, total: Double, paymentMethod: String) {
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text("Step 4: Invoice Preview", style = MaterialTheme.typography.titleLarge)
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("INVOICE", style = MaterialTheme.typography.headlineMedium, modifier = Modifier.align(Alignment.CenterHorizontally))
                HorizontalDivider()
                Text("Customer: ${customer.name}", style = MaterialTheme.typography.titleMedium)
                Text("Phone: ${customer.mobile}", style = MaterialTheme.typography.bodyMedium)
                HorizontalDivider()
                items.forEach { item ->
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("${item.productName} (x${item.quantity})")
                        Text("₹${item.price * item.quantity}")
                    }
                }
                HorizontalDivider()
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Total Amount:", style = MaterialTheme.typography.titleLarge)
                    Text("₹$total", style = MaterialTheme.typography.titleLarge)
                }
                Text("Payment Mode: $paymentMethod", style = MaterialTheme.typography.bodyMedium)
            }
        }
    }
}

