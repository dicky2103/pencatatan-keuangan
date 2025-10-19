document.addEventListener('DOMContentLoaded', () => {

    const STORAGE_KEY = 'umkm-finance-transactions';
    const MAX_TRANSACTIONS = 999;
    
    const elements = {
        appTitle: document.getElementById('app-title'),
        businessName: document.getElementById('business-name'),
        currentBalance: document.getElementById('current-balance'),
        totalIncome: document.getElementById('total-income'),
        totalExpense: document.getElementById('total-expense'),
        totalTransactions: document.getElementById('total-transactions'),
        transactionForm: document.getElementById('transaction-form'),
        transactionType: document.getElementById('transaction-type'),
        transactionCategory: document.getElementById('transaction-category'),
        transactionAmount: document.getElementById('transaction-amount'),
        transactionDescription: document.getElementById('transaction-description'),
        addTransactionBtn: document.getElementById('add-transaction-btn'),
        transactionsContainer: document.getElementById('transactions-container'),
        transactionsList: document.getElementById('transactions-list'),
        emptyState: document.getElementById('empty-state'),
        filterType: document.getElementById('filter-type'),
        limitWarning: document.getElementById('limit-warning'),
        chartEmptyState1: document.getElementById('chart-empty-state-1'),
        chartEmptyState2: document.getElementById('chart-empty-state-2'),
        chartEmptyState3: document.getElementById('chart-empty-state-3'),
        incomeExpenseChartCtx: document.getElementById('incomeExpenseChart').getContext('2d'),
        categoryChartCtx: document.getElementById('categoryChart').getContext('2d'),
        trendChartCtx: document.getElementById('trendChart').getContext('2d'),
    };

    const CATEGORIES = {
        income: {
            'Penjualan Produk': 'bg-green-100 text-green-800',
            'Pendapatan Jasa': 'bg-green-100 text-green-800',
            'Modal Tambahan': 'bg-green-100 text-green-800',
            'Lainnya (Pemasukan)': 'bg-green-100 text-green-800',
        },
        expense: {
            'Pembelian Bahan Baku': 'bg-red-100 text-red-800',
            'Gaji Karyawan': 'bg-red-100 text-red-800',
            'Biaya Operasional (Listrik/Air/Internet)': 'bg-red-100 text-red-800',
            'Sewa Tempat': 'bg-red-100 text-red-800',
            'Pemasaran/Iklan': 'bg-red-100 text-red-800',
            'Lainnya (Pengeluaran)': 'bg-red-100 text-red-800',
        }
    };

    let transactions = [];
    let incomeExpenseChart, categoryChart, trendChart;


    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const loadTransactions = () => {
        const data = localStorage.getItem(STORAGE_KEY);
        transactions = data ? JSON.parse(data) : [];
       
        transactions = transactions.map(t => ({
            ...t,
            date: t.date || new Date().toISOString().split('T')[0]
        }));
    };

    const saveTransactions = () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    };


    const deleteTransaction = (id) => {
      
        if (!confirm('Anda yakin ingin menghapus transaksi ini? Aksi ini tidak dapat dibatalkan.')) {
            return;
        }

        const initialLength = transactions.length;
        transactions = transactions.filter(t => t.id !== id);

        if (transactions.length < initialLength) {
            saveTransactions();
            updateUI();
            alert('Transaksi berhasil dihapus.');
        } else {
            alert('Gagal menghapus transaksi.');
        }
    };


    const updateCategoryOptions = (type) => {
        const select = elements.transactionCategory;
        select.innerHTML = '<option value="">Pilih Kategori</option>'; 
        
        if (type && CATEGORIES[type]) {
            Object.keys(CATEGORIES[type]).forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                select.appendChild(option);
            });
        }
    };

    const updateMetrics = () => {
        let totalIncome = 0;
        let totalExpense = 0;

        transactions.forEach(t => {
            const amount = parseFloat(t.amount);
            if (t.type === 'income') {
                totalIncome += amount;
            } else if (t.type === 'expense') {
                totalExpense += amount;
            }
        });

        const currentBalance = totalIncome - totalExpense;

        elements.currentBalance.textContent = formatCurrency(currentBalance);
        elements.totalIncome.textContent = formatCurrency(totalIncome);
        elements.totalExpense.textContent = formatCurrency(totalExpense);
        elements.totalTransactions.textContent = transactions.length;

        // Perbarui warna saldo berdasarkan nilai
        elements.currentBalance.classList.remove('text-green-600', 'text-red-600', 'text-white');
        if (currentBalance > 0) {
            elements.currentBalance.classList.add('text-green-600');
        } else if (currentBalance < 0) {
            elements.currentBalance.classList.add('text-red-600');
        } else {
            elements.currentBalance.classList.add('text-white'); 
        }
    };

 
    const renderTransactionItem = (transaction) => {
        const isIncome = transaction.type === 'income';
        const sign = isIncome ? '+' : '-';
        const colorClass = isIncome ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';
        const amountDisplay = `${sign} ${formatCurrency(transaction.amount)}`;
        const categoryTagClass = CATEGORIES[transaction.type]?.[transaction.category] || 'bg-gray-100 text-gray-800';
        const date = new Date(transaction.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });

        const li = document.createElement('div');
        li.className = `flex items-center justify-between p-4 ${colorClass.replace('bg-', 'hover:bg-')} rounded-lg transition-all duration-200 animate-fade-in border-l-4 ${isIncome ? 'border-green-500' : 'border-red-500'}`;
        li.dataset.type = transaction.type;
        li.dataset.id = transaction.id;

        li.innerHTML = `
            <div class="flex items-center space-x-3 min-w-0 flex-1">
                <div class="w-8 h-8 rounded-full ${isIncome ? 'bg-green-500' : 'bg-red-500'} flex items-center justify-center flex-shrink-0">
                    <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${isIncome ? 'M13 7l5 5m0 0l-5 5m5-5H6' : 'M11 17l-5-5m0 0l5-5m-5 5h12'}"></path>
                    </svg>
                </div>
                <div class="min-w-0 flex-1">
                    <p class="text-gray-800 font-medium truncate">${transaction.description}</p>
                    <div class="flex items-center space-x-2 mt-1 text-xs">
                        <span class="px-2 py-0.5 rounded-full ${categoryTagClass} font-semibold">${transaction.category}</span>
                        <span class="text-gray-500">• ${date}</span>
                    </div>
                </div>
            </div>
            <div class="text-right flex-shrink-0 flex items-center space-x-4">
                <p class="text-lg font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}">${amountDisplay}</p>
                <button class="delete-btn text-gray-400 hover:text-red-500 transition-colors" data-id="${transaction.id}" title="Hapus Transaksi">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </div>
        `;
        return li;
    };


    const renderTransactions = () => {
        const filterType = elements.filterType.value;
        const filteredTransactions = transactions.filter(t => 
            !filterType || t.type === filterType
        ).sort((a, b) => new Date(b.date) - new Date(a.date)); 

        elements.transactionsList.innerHTML = '';
        if (filteredTransactions.length === 0) {
            elements.emptyState.classList.remove('hidden');
            elements.transactionsList.classList.add('hidden');
        } else {
            elements.emptyState.classList.add('hidden');
            elements.transactionsList.classList.remove('hidden');
            filteredTransactions.forEach(t => {
                elements.transactionsList.appendChild(renderTransactionItem(t));
            });

      
            elements.transactionsList.querySelectorAll('.delete-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const id = parseInt(e.currentTarget.dataset.id);
                    deleteTransaction(id);
                });
            });
        }
    };


    const updateUI = () => {
        updateMetrics();
        renderTransactions();
        updateCharts();
        

        if (transactions.length >= MAX_TRANSACTIONS) {
            elements.limitWarning.classList.remove('hidden');
            elements.addTransactionBtn.disabled = true;
            elements.addTransactionBtn.innerHTML = '<svg class="w-5 h-5 loading-spinner mr-2" viewBox="0 0 24 24"></svg> Batas Tercapai';
        } else {
            elements.limitWarning.classList.add('hidden');
            elements.addTransactionBtn.disabled = false;
            elements.addTransactionBtn.innerHTML = '<span>Tambah</span>';
        }
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();

        if (transactions.length >= MAX_TRANSACTIONS) {
            alert('Batas maksimum transaksi (999) telah tercapai.');
            return;
        }

        const type = elements.transactionType.value;
        const category = elements.transactionCategory.value;
        const amount = parseFloat(elements.transactionAmount.value);
        const description = elements.transactionDescription.value.trim();

        if (!type || !category || amount <= 0 || !description) {
            alert('Semua field harus diisi dengan benar.');
            return;
        }


        elements.addTransactionBtn.disabled = true;
        elements.addTransactionBtn.innerHTML = '<div class="loading-spinner"></div> <span>Memproses...</span>';

        const newTransaction = {
            id: Date.now(),
            type: type,
            category: category,
            amount: amount,
            description: description,
            date: new Date().toISOString().split('T')[0] 
        };

        transactions.push(newTransaction);
        saveTransactions();
        updateUI();


        elements.transactionForm.reset();
        elements.transactionType.value = 'income'; 
        updateCategoryOptions('income');
    };

    const prepareChartData = () => {
        let income = 0;
        let expense = 0;
        const categoryMap = {}; 
        const monthlyData = {}; 
        transactions.forEach(t => {
            const amount = parseFloat(t.amount);
            

            const dateObj = new Date(t.date);
            const monthYear = dateObj.toLocaleDateString('id-ID', { year: 'numeric', month: 'short' });


            if (t.type === 'income') {
                income += amount;
            } else {
                expense += amount;
            }


            if (t.type === 'expense') {
                categoryMap[t.category] = (categoryMap[t.category] || 0) + amount;
            }


            if (!monthlyData[monthYear]) {
                monthlyData[monthYear] = { income: 0, expense: 0, date: dateObj };
            }
            monthlyData[monthYear][t.type] += amount;
        });


        const sortedMonthsKeys = Object.keys(monthlyData).sort((a, b) => {
            return monthlyData[a].date - monthlyData[b].date;
        });

        const trendLabels = sortedMonthsKeys;
        const trendIncomeData = sortedMonthsKeys.map(month => monthlyData[month].income);
        const trendExpenseData = sortedMonthsKeys.map(month => monthlyData[month].expense);
        
        return {
            incomeExpense: [income, expense],
            categoryLabels: Object.keys(categoryMap),
            categoryData: Object.values(categoryMap),
            trendLabels,
            trendIncomeData,
            trendExpenseData
        };
    };


    const updateCharts = () => {
        const data = prepareChartData();


        if (incomeExpenseChart) incomeExpenseChart.destroy();
        if (data.incomeExpense.some(val => val > 0)) {
            elements.chartEmptyState1.classList.add('hidden');
            incomeExpenseChart = new Chart(elements.incomeExpenseChartCtx, {
                type: 'bar',
                data: {
                    labels: ['Pemasukan', 'Pengeluaran'],
                    datasets: [{
                        label: 'Jumlah (Rp)',
                        data: data.incomeExpense,
                        backgroundColor: ['#10b981', '#ef4444'], // Green and Red
                        borderRadius: 5,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) { return formatCurrency(value); }
                            }
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                                }
                            }
                        }
                    }
                }
            });
        } else {
            elements.chartEmptyState1.classList.remove('hidden');
        }


        if (categoryChart) categoryChart.destroy();
        if (data.categoryData.some(val => val > 0)) {
            elements.chartEmptyState2.classList.add('hidden');
            categoryChart = new Chart(elements.categoryChartCtx, {
                type: 'doughnut',
                data: {
                    labels: data.categoryLabels,
                    datasets: [{
                        data: data.categoryData,
                        backgroundColor: [
                            '#667eea', '#764ba2', '#ff6b6b', '#ffd166', '#06d6a0', 
                            '#118ab2', '#e9c46a', '#f4a261'
                        ],
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'right' },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((value / total) * 100).toFixed(1) + '%';
                                    return `${label}: ${formatCurrency(value)} (${percentage})`;
                                }
                            }
                        }
                    }
                }
            });
        } else {
            elements.chartEmptyState2.classList.remove('hidden');
        }

 
        if (trendChart) trendChart.destroy();
        if (data.trendLabels.length > 0) {
            elements.chartEmptyState3.classList.add('hidden');
            trendChart = new Chart(elements.trendChartCtx, {
                type: 'line',
                data: {
                    labels: data.trendLabels,
                    datasets: [
                        {
                            label: 'Pemasukan',
                            data: data.trendIncomeData,
                            borderColor: '#10b981', // Green
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: 'Pengeluaran',
                            data: data.trendExpenseData,
                            borderColor: '#ef4444', // Red
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            fill: true,
                            tension: 0.4
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) { return formatCurrency(value); }
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            callbacks: {
                                label: function(context) {
                                    return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
                                }
                            }
                        },
                        legend: { position: 'top' }
                    }
                }
            });
        } else {
            elements.chartEmptyState3.classList.remove('hidden');
        }
    };


    updateCategoryOptions(elements.transactionType.value); 


    elements.transactionType.addEventListener('change', (e) => updateCategoryOptions(e.target.value));
    elements.transactionForm.addEventListener('submit', handleFormSubmit);
    elements.filterType.addEventListener('change', renderTransactions);


    loadTransactions();
    updateUI();
});