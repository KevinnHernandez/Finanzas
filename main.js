const apiUrl = 'https://6509e208f6553137159c30bf.mockapi.io/Registros';
let myForm = document.querySelector("form");
let myTable = document.querySelector("#myData");
let deleteButton = document.getElementById("deleteButton");
let modifyButton = document.getElementById("modifyButton");
let searchButton = document.getElementById("searchButton");
let searchIdInput = document.getElementById("searchId");
let counter = 1;
let total = 0;
let totalIngresos = 0;
let totalEgresos = 0;

async function fetchDataFromAPI() {
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    } catch (error) {
        console.error('Error fetching data from API:', error);
        throw error;
    }
}

async function sendDataToAPI(method, data, id) {
    try {
        let url = `${apiUrl}/${id}`;
        if (method === 'POST') {
            url = apiUrl;  // For POST requests, use the main API URL
        }

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        if (method === 'POST') {
            const createdData = await response.json();
            insertRow(createdData);  // Insert the new data in the table
        } else if (method === 'PUT') {
            const updatedData = await response.json();
            const rowToUpdate = findRowById(updatedData.id);
            if (rowToUpdate) {
                rowToUpdate.querySelector('td:nth-child(3)').textContent = updatedData.valor;
                rowToUpdate.querySelector('td:nth-child(4)').textContent = updatedData.caja;
            }
        }

        return true;
    } catch (error) {
        console.error('Error sending data to API:', error);
        throw error;
    }
}

function insertRow(formData) {
    let row = document.createElement("tr");
    row.innerHTML = `
    <td><input type="checkbox" class="select-row"></td>
    <td>${counter}</td>
    <td>${formData.valor}</td>
    <td>${formData.caja}</td>
`;
    myTable.appendChild(row);
    counter++;
}

function updateTotal() {
    total = 0;
    let rows = myTable.querySelectorAll('tr');
    for (let i = 0; i < rows.length; i++) {
        let row = rows[i];
        let valor = parseFloat(row.querySelector('td:nth-child(3)').textContent);
        let tipo = row.querySelector('td:nth-child(4)').textContent;

        if (tipo === 'ingreso') {
            total += valor;
        } else if (tipo === 'egreso') {
            total -= valor;
        }
    }

    const totalAmountElement = document.getElementById('totalAmount');
    totalAmountElement.textContent = `Total: $${total.toFixed(2)}`;
}

function updateTotalIngresos() {
    totalIngresos = 0;
    let rows = myTable.querySelectorAll('tr');
    for (let i = 0; i < rows.length; i++) {
        let row = rows[i];
        let valor = parseFloat(row.querySelector('td:nth-child(3)').textContent);
        let tipo = row.querySelector('td:nth-child(4)').textContent;

        if (tipo === 'ingreso') {
            totalIngresos += valor;
        }
    }

    const totalIngresosElement = document.getElementById('totalIngresos');
    totalIngresosElement.textContent = `Total de Ingresos: $${totalIngresos.toFixed(2)}`;
}

function updateTotalEgresos() {
    totalEgresos = 0;
    let rows = myTable.querySelectorAll('tr');
    for (let i = 0; i < rows.length; i++) {
        let row = rows[i];
        let valor = parseFloat(row.querySelector('td:nth-child(3)').textContent);
        let tipo = row.querySelector('td:nth-child(4)').textContent;

        if (tipo === 'egreso') {
            totalEgresos += valor;
        }
    }

    const totalEgresosElement = document.getElementById('totalEgresos');
    totalEgresosElement.textContent = `Total de Egresos: $${totalEgresos.toFixed(2)}`;
}

function saveDataToLocalStorage() {
    let dataToSave = [];
    let rows = myTable.querySelectorAll('tr');
    for (let i = 0; i < rows.length; i++) {
        let row = rows[i];
        let valor = parseFloat(row.querySelector('td:nth-child(3)').textContent);
        let tipo = row.querySelector('td:nth-child(4)').textContent;
        dataToSave.push({ valor, caja: tipo });
    }
    localStorage.setItem('tableData', JSON.stringify(dataToSave));
}

function updateButtons() {
    let checkboxes = document.querySelectorAll('.select-row:checked');
    if (checkboxes.length > 0) {
        deleteButton.disabled = false;
        modifyButton.disabled = false;
    } else {
        deleteButton.disabled = true;
        modifyButton.disabled = true;
    }
}

function findRowById(id) {
    let rows = myTable.querySelectorAll('tr');
    for (let i = 0; i < rows.length; i++) {
        let rowId = parseInt(rows[i].querySelector('td:nth-child(2)').textContent);
        if (rowId === id) {
            return rows[i];
        }
    }
    return null;
}

document.addEventListener("DOMContentLoaded", async () => {
    try {
        const apiData = await fetchDataFromAPI();
        apiData.forEach(data => insertRow(data));
    } catch (error) {
        console.error('Error loading data from API:', error);
    }

    updateTotal();
    updateTotalIngresos();
    updateTotalEgresos();

    myForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = Object.fromEntries(new FormData(e.target));
        insertRow(formData);
        updateTotal();
        updateTotalIngresos();
        updateTotalEgresos();

        try {
            await sendDataToAPI('POST', formData);
        } catch (error) {
            console.error('Error sending data to API:', error);
        }
    });

    myTable.addEventListener('change', () => {
        updateTotal();
        updateTotalIngresos();
        updateTotalEgresos();
        updateButtons();
        saveDataToLocalStorage();
    });

    async function deleteDataFromAPI(ids) {
        try {
            const promises = ids.map(async id => {
                const response = await fetch(`${apiUrl}/${id}`, {
                    method: 'DELETE'
                });
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            });
            return Promise.all(promises);
        } catch (error) {
            console.error('Error deleting data from API:', error);
            throw error;
        }
    }

    deleteButton.addEventListener('click', async () => {
        let checkboxes = document.querySelectorAll('.select-row:checked');
        let dataToDelete = Array.from(checkboxes).map(checkbox => {
            return checkbox.closest('tr').querySelector('td:nth-child(2)').textContent;
        });

        try {
            await deleteDataFromAPI(dataToDelete);
        } catch (error) {
            console.error('Error deleting data from API:', error);
        }

        checkboxes.forEach(checkbox => {
            let row = checkbox.closest('tr');
            myTable.removeChild(row);
        });
        counter -= checkboxes.length;
        updateTotal();
        updateTotalIngresos();
        updateTotalEgresos();
        updateButtons();
        saveDataToLocalStorage();
    });

    modifyButton.addEventListener('click', async () => {
        let checkboxes = document.querySelectorAll('.select-row:checked');

        for (const checkbox of checkboxes) {
            const row = checkbox.closest('tr');
            const id = parseInt(row.querySelector('td:nth-child(2)').textContent);
            const newValue = prompt(`Ingrese el nuevo monto para la fila #${id}:`);

            if (newValue !== null && !isNaN(newValue) && parseFloat(newValue) >= 0) {
                const dataToModify = {
                    valor: parseFloat(newValue).toFixed(2),
                    caja: row.querySelector('td:nth-child(4)').textContent
                };

                try {
                    await sendDataToAPI('PUT', dataToModify, id);
                    row.querySelector('td:nth-child(3)').textContent = dataToModify.valor;
                } catch (error) {
                    console.error('Error modifying data in API:', error);
                }
            }
        }

        updateTotal();
        updateTotalIngresos();
        updateTotalEgresos();
        saveDataToLocalStorage();
    });

    searchButton.addEventListener('click', () => {
        const searchId = parseInt(searchIdInput.value);
        const row = findRowById(searchId);
        if (row) {
            const valor = parseFloat(row.querySelector('td:nth-child(3)').textContent);
            const tipo = row.querySelector('td:nth-child(4)').textContent;
            alert(`ID: ${searchId}\nMonto (Valor): $${valor.toFixed(2)}\nTipo: ${tipo}`);
        } else {
            alert(`No se encontró ninguna fila con el ID ${searchId}`);
        }
    });
});
