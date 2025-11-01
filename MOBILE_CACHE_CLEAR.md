# Как да Clear-неш Кеша на Мобилно

## 🍎 iOS Safari

### Метод 1: Clear само за този сайт
1. Отвори Safari
2. Натисни иконата **aA** в адресната лента (горе вляво)
3. Избери **Website Settings**
4. Scroll down и натисни **Clear History and Website Data**
5. Потвърди

### Метод 2: Изтрий всички кешове (препоръчително)
1. Отвори **Settings** (Настройки)
2. Scroll down до **Safari**
3. Scroll down и натисни **Clear History and Website Data**
4. Потвърди
5. Отвори Safari отново и зареди сайта

### Метод 3: Hard Refresh (бърз)
1. Отвори страницата в Safari
2. Tap and hold на **Reload** бутона (⟳)
3. Ще се появи опция **"Reload Without Content Blockers"**
4. Или затвори Safari напълно (swipe up) и отвори отново

### Метод 4: Unregister Service Worker (напреднал)
1. Отвори Safari DevTools (ако имаш Mac):
   - Mac: Safari → Develop → [iPhone Name] → [Page]
   - В Console: `navigator.serviceWorker.getRegistrations().then(r => r.forEach(reg => reg.unregister()))`
2. Затвори Safari напълно
3. Отвори отново и зареди сайта

---

## 🤖 Android Chrome

### Метод 1: Clear само за този сайт
1. Отвори Chrome
2. Натисни иконата **🔒** (lock) в адресната лента
3. Избери **Site settings**
4. Scroll down и натисни **Clear & reset**
5. Потвърди

### Метод 2: Clear всички кешове
1. Отвори Chrome
2. Меню (⋮) → **Settings**
3. **Privacy and security** → **Clear browsing data**
4. Избери:
   - ✅ Cached images and files
   - ✅ Site settings (optional)
5. Натисни **Clear data**

### Метод 3: Hard Refresh
1. Зареди страницата
2. Затвори Chrome напълно (свали го от Recent Apps)
3. Отвори отново и зареди

### Метод 4: Unregister Service Worker (Chrome DevTools)
1. Chrome → **Menu (⋮)** → **More tools** → **Developer tools**
2. Отиди на **Application** tab
3. **Service Workers** (в лявата страна)
4. Натисни **Unregister** до твоя Service Worker
5. Refresh страницата

**Или в Console:**
```javascript
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
});
```

---

## 🧪 Как да Потвърдиш че Кешът е Clear-нат

### Проверка 1: Service Worker Version
1. Зареди страницата
2. Виж бутона **SW** в долния десен ъгъл
3. Tap за да видиш версията
4. Трябва да е **v3.3.1** (или най-новата)

### Проверка 2: Browser Console (Android Chrome)
1. Chrome DevTools → **Console**
2. Напиши:
```javascript
navigator.serviceWorker.ready.then(reg => {
  reg.active.postMessage({ type: 'GET_VERSION' });
});
```
3. Виж лога - трябва да е `v3.3.1`

### Проверка 3: Hard Reload със запазен лог
1. Android Chrome DevTools → **Application** → **Service Workers**
2. Check ✅ **Update on reload**
3. Refresh страницата
4. Виж новата версия се зарежда

---

## ⚡ Бърз Метод (Препоръчвам)

### За iOS:
1. **Settings → Safari → Clear History and Website Data**
2. Затвори Safari напълно (swipe up от Recent)
3. Отвори Safari и зареди сайта
4. Tap **SW** бутона да провериш версията

### За Android:
1. **Chrome → Menu → Settings → Privacy → Clear browsing data**
2. Select **Cached images and files**
3. Clear data
4. Затвори Chrome напълно
5. Отвори Chrome и зареди сайта
6. Tap **SW** бутона да провериш версията

---

## 🔍 Debug: Ако SW бутонът все още не се появява

### 1. Провери дали Service Worker се регистрира:
```javascript
// В Browser Console
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Registered SWs:', regs);
});
```

### 2. Провери дали компонентът се зарежда:
```javascript
// В Browser Console
console.log('ConditionalNav loaded?', document.querySelector('[class*="SessionProvider"]'));
```

### 3. Провери network requests:
- DevTools → Network → Filter: `sw.js`
- Трябва да видиш `/sw.js` заредено със status 200

### 4. Провери console за грешки:
- DevTools → Console
- Виж има ли червени грешки

---

## 📝 Забележки

- **iOS** понякога кешира агресивно - може да се наложи да изчакаш 1-2 минути след clear
- **Android Chrome** е по-бърз с updates
- **PWA режим** (Add to Home Screen) може да изисква de-install и re-install на app-а
- **Service Worker** може да се активира със закъснение - изчакай 5-10 секунди след reload

---

## 🆘 Ако нищо не работи

### Крайна мярка - Uninstall PWA:
1. **iOS**: Long press на app icon → Remove App
2. **Android**: Long press на app icon → App info → Uninstall
3. Clear browser data (виж горе)
4. Reload сайта в browser
5. Install PWA отново

### Провери дали Service Worker изобщо работи:
```javascript
// В Console
if ('serviceWorker' in navigator) {
  console.log('✅ SW supported');
} else {
  console.log('❌ SW NOT supported');
}
```

### Провери network connection:
- Може да е firewall или proxy блокира `/sw.js`
- Опитай на друга WiFi мрежа

