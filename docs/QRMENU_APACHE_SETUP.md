# Apache Setup за qrmenu.gsoft.bg

## Проблем
403 Forbidden при достъп до `https://qrmenu.gsoft.bg`

## Решение

### Стъпка 1: Копирай конфигурацията на сървъра

```bash
# Копирай конфигурационния файл
sudo cp qrmenu-gsoft-ssl.conf /etc/apache2/sites-available/qrmenu-gsoft-ssl.conf

# Активирай сайта
sudo a2ensite qrmenu-gsoft-ssl.conf
```

### Стъпка 2: Провери правата на директориите

```bash
# Провери дали директорията съществува
ls -la /var/www/html/qrmenu

# Ако не съществува, създай я
sudo mkdir -p /var/www/html/qrmenu
sudo chown -R www-data:www-data /var/www/html/qrmenu

# Създай директория за uploads
sudo mkdir -p /var/www/uploads/qrmenu
sudo chown -R www-data:www-data /var/www/uploads/qrmenu
```

### Стъпка 3: Провери SSL сертификат

```bash
# Провери дали SSL сертификатът съществува
sudo ls -la /etc/letsencrypt/live/qrmenu.gsoft.bg/

# Ако не съществува, създай го
sudo certbot --apache -d qrmenu.gsoft.bg -d www.qrmenu.gsoft.bg
```

### Стъпка 4: Провери Apache конфигурацията

```bash
# Тест на конфигурацията
sudo apachectl configtest

# Ако е OK, рестартирай Apache
sudo systemctl restart apache2
```

### Стъпка 5: Провери дали работи

```bash
# Провери от сървъра
curl -I https://qrmenu.gsoft.bg

# Провери от браузър
# Отвори https://qrmenu.gsoft.bg
```

## Важни бележки

1. **Порт:** Конфигурацията проксира към `http://127.0.0.1:4000/` - увери се че Next.js работи на този порт
2. **Директория:** Увери се че приложението е в `/var/www/html/qrmenu`
3. **SSL:** Увери се че SSL сертификатът е валиден за `qrmenu.gsoft.bg`
4. **PM2:** Увери се че PM2 процесът работи и слуша на порт 4000

## Проверка на PM2

```bash
# Провери статус
pm2 status

# Провери дали слуша на правилния порт
netstat -tlnp | grep :4000

# Провери логове
pm2 logs qrmenu --lines 50
```

## Ако все още не работи

1. Провери Apache error logs:
   ```bash
   sudo tail -f /var/log/apache2/qrmenu-ssl-error.log
   ```

2. Провери дали mod_ssl е активиран:
   ```bash
   sudo a2enmod ssl
   sudo a2enmod proxy
   sudo a2enmod proxy_http
   sudo a2enmod headers
   sudo a2enmod rewrite
   sudo systemctl restart apache2
   ```

3. Провери firewall:
   ```bash
   sudo ufw status
   sudo ufw allow 443/tcp
   ```

