const http = require('http');
const fs = require('fs');
const ping = require('net-ping');

// Функція для читання файлу зі списком IP-адрес
function readPrintersFile() {
    try {
        const printers = JSON.parse(fs.readFileSync('./data/printers.json'));
        return printers;
    } catch (error) {
        console.error("Помилка читання файлу зі списком принтерів:", error);
        return [];
    }
}

// Створення сесії для пінгування
const session = ping.createSession();

// Функція для пінгування IP-адреси
function pingHost(ip) {
    return new Promise((resolve, reject) => {
        session.pingHost(ip, function (error) {
            if (error) {
                console.log(ip + ": " + error.toString());
                resolve({ ip, status: false }); // Відмічаємо, що пінгування не вдалося
            } else {
                console.log(ip + ": Alive");
                resolve({ ip, status: true }); // Відмічаємо, що пінгування було успішним
            }
        });
    });
}

// Функція для пінгування всіх IP-адрес
async function pingAllHosts(ipAddresses) {
    const results = await Promise.all(ipAddresses.map(ip => pingHost(ip)));
    return results;
}

// Функція для оновлення статусу в таблиці HTML
function updateTable(results) {
    let tableContent = '<table border="1"><tr><th>IP-адреса</th><th>Статус</th></tr>';

    // Додаємо рядки таблиці з результатами пінгування
    results.forEach(({ ip, status }) => {
        console.log(`IP: ${ip}, Статус: ${status ? "Online" : "Offline"}`);
        const lampIcon = status ? "🟢" : "🔴";
        tableContent += `<tr><td>${ip}</td><td>${lampIcon} ${status ? "Online" : "Offline"}</td></tr>`;
    });

    tableContent += '</table>';

    // Записати згенерований HTML-контент у файл printer.html
    fs.writeFileSync('printer.html', tableContent, 'utf8', function(err) {
        if (err) {
            console.error('Помилка при записі в файл:', err);
        } else {
            console.log('Файл printer.html успішно оновлено.');
        }
    });
};

// Створення веб-сервера
const server = http.createServer(async function (req, res) {
    try {
        const ipAddresses = readPrintersFile(); // Отримуємо список IP-адрес з файлу
        const results = await pingAllHosts(ipAddresses); // Пінгуємо всі адреси
        updateTable(results); // Оновлюємо таблицю з результатами пінгування
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Дані оновлено. Перевірте файл printer.html');
    } catch (error) {
        console.error("Помилка під час пінгування:", error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
    }
});

// Прослуховування порту 3000
server.listen(3000, 'localhost', function () {
    console.log('Веб-сервер запущено на http://localhost:3000/');
});
