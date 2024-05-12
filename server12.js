const fs = require('fs');
const ping = require('net-ping');
const http = require('http');

// Функція для читання файлу зі списком IP-адрес
function readPrintersFile() {
    try {
        const printers = JSON.parse(fs.readFileSync('printers.json'));
        return printers;
    } catch (error) {
        console.error("Помилка читання файлу зі списком принтерів:", error);
        return [];
    }
}

// Створення сесії для пінгування
const session = ping.createSession();

// Список IP-адрес для пінгування
const ipAddresses = readPrintersFile();

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
function updateTable(res, results) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' }); // Встановлюємо кодування UTF-8
    res.write('<html><head><title>Принтери</title><meta charset="UTF-8"></head><body>');
    res.write('<h1>Статус принтерів</h1>');
    res.write('<table border="1"><tr><th>IP-адреса</th><th>Статус</th></tr>');

    // Додаємо рядки таблиці з результатами пінгування
    results.forEach(({ ip, status }) => {
        console.log(`IP: ${ip}, Статус: ${status ? "Online" : "Offline"}`);
        const lampClass = status ? "lamp-online" : "lamp-offline";
        const lampIcon = status ? "🟢" : "🔴";
        const tableRow = `<tr><td><a href="http://${ip}">${ip}</a></td><td><span class="lamp ${lampClass}">${lampIcon}</span>${status ? "Online" : "Offline"}</td></tr>`;
        res.write(tableRow);
    });

    res.write('</table></body></html>');
    res.end(); // Завершуємо відправлення відповіді
}

// Створення веб-сервера
const server = http.createServer(async function (req, res) {
    try {
        const results = await pingAllHosts(ipAddresses); // Пінгуємо всі адреси
        updateTable(res, results); // Оновлюємо таблицю з результатами пінгування
    } catch (error) {
        console.error("Помилка пінгування:", error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
    }
});

// Прослуховування порту 3000
server.listen(3000, 'deadspace.site/table.html', function () {
    console.log('Веб-сервер запущено на http://deadspace.site/table.html');
});


