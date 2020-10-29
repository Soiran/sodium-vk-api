# sodium-vk-api

Sodium - фреймворк для удобного создания ботов VK. В его функционал входят инструменты для контекстной обработки сообщения, создания команд, сценариев, работы с JSON и логом.

### Ссылки

#### Документация

[Боты](https://vk.com/dev/bots_docs), [методы сообщений](https://vk.com/dev/messages), [клавиатура для ботов](https://vk.com/dev/bots_docs_3)

#### Разработчики

[sodium-vk-api](https://github.com/Soiran), [node-vk-bot-api](https://github.com/bifot), [axios](https://github.com/axios)


# Инициализация и события

Бот работает по принципам Longpoll, поэтому все ивенты вы будете получать независимо.

### Инициализация

```javascript
const { Bot } = require('kesha-vk-api/lib')
const { Data } = require('kesha-vk-api/essentials')

const token = new Data('./config').data.token
const bot = new Bot(token)

// ...

bot.start(err => {
    if (err) {
        console.log(err)
    } else {
        console.log(start)
    }
})
```

Есть два типа модулей: lib и essentials. В lib хранятся инструменты для работы с контекстом и API, а в essentials - внешние инструменты.

При инициализации объекта Bot в него обязательно нужно вложить токен, которого можно достать из вашего **config.json** файла, ****или используя обычную строку.

При открытии доступа к коду вашего бота убедитесь, что токена нигде в коде. Он должен быть скрыт либо в вашем конфиг файле, либо удален из кода бота заранее. Используйте .gitignore для скрытия файлов.

## События

Рекомендую подробнее ознакомиться со всеми типами событий в официальной документации.

https://vk.com/dev/groups_events

### Обработка

Чтобы обрабатывать конкретное событие, используйте метод **.event**.

```javascript
bot.event('wall_post_new', event => {
    bot.send(db.data.userIds, 'В паблике новый пост!')
})
```

### Сообщение

Чтобы добавить реакцию боту, приведите контекс команды через метод **.on**. У бота есть отдельный метод **.message**, позволяющий напрямую обрабатывать объекты сообщений.

```javascript
// команда
bot.on('...', msg => {
    msg == {
        // ... поля ответа API,
        reply: Function, // если есть поле peer_id
        patterns: [...]
    }
})

// прямая обработка
bot.message(msg => { ... })
```

**Ответ**

Если поля ответа от API имеют поле **peer\_id**, то в него автоматически вкладывается метод **.reply**. Он позволяет отправить новое сообщение в эту же беседу или диалог.

```javascript
bot.message(msg => {
    // ...
    msg.reply('Текст сообщения', {
        // https://vk.com/dev/objects/message
    })
})
```

# Методы бота

### Добавление обработчиков

#### Команда

```javascript
const { Command } = require('sodium-vk-api/lib')
// ...
bot.addCommands(...new Command('...', { ... }))
```

#### Команда события сообщения

```javascript
const { MessageEventCommand } = require('sodium-vk-api/lib')
// ...
bot.addMessageEventCommands(
    ...new MessageEventCommand('...', event => { ... })
)
```

**Сцена**

```javascript
const { Stage } = require('sodium-vk-api/lib')
// ...
bot.addStages(
    ...new Stage(id, [ ... msg => { ... } ])
)
```

#### Плагин

```javascript
const { Plugin } = require('sodium-vk-api/lib')
// ...
bot.addPlugin(new Plugin(require('./...')))
```

### API

В бота встроенные основные методы обращения к API, но вы также можете использовать другие.

#### Get

```javascript
bot.get('имя_метода', { ... })

// Получить данные о пользователе
bot.getUser(id, { ... })

// Получить данные о чате
bot.getChat(id, { ... })

// Получить данные о группе
bot.getGroup(id, { ... })
```

**Post**

```javascript
bot.post('имя_метода', { ... })

// Отправить сообщение
bot.send(id, { ... })

// Отправить реакцию на событие сообщения.
// Подробнее можно ознакомиться в главе
// "Клавиатура и кнопки"
bot.sendMessageEventAnswer(eventObject, { ... })
```

### Прочее

**Локальные сообщения**

Вы можете отправить боту сообщения локально, и он выдаст вам ответ через приведенные обработчики.

```javascript
bot.localMessage({ ... }, ...msg => { ... })
```

#### Сокеты

Ответы бота можно подключить к внешним обработчикам или другим ботам.

```javascript
bot.socketTo(...Bot || Function)
```

# Команды

### Простые команды

Простые команды добавляются методом **.on** и проверяют текст сообщения целиком. Вы также можете использовать регулярные выражения.

```javascript
// Префикс "~" означает, что текст сообщения
// не проверяется на регистр букв
bot.on('~Начать|Старт', msg => {
    // Можно проверить на то, что
    // пользователь уже писал боту
    if (!db.data.chats.includes(msg.user)) {
        msg.reply('Начать уже пол дела!')
    }
})
```

```javascript
bot.on(/^\w(?:\s[+*]\s\w)+$/g, msg => {
    let calculate = new Function(`return ${msg.content}`)
    msg.reply(calculate())
})
```

### **Контекстные команды**

Контекстные команды добавляются методом **.command** и проверяют только начало сообщения, используя синтаксис паттернов.

#### Синтаксис

```javascript
// в данном случае первый паттерн проверяется на
// два слова, так что пользователь может написать
// и то, и то.
bot.command('~привет|салют', msg => {
    msg.reply('Привет-привет!')
    console.log(msg.patterns.list)
    // > ["привет", остальной текст]
})

// в данном случае паттерн "бот, " не обязателен
// для указания, тоесть пользователь может написать
// "повтори ..." и бот все равно получит сообщение.
bot.command(
    "~(бот, )повтори",
    msg => {
        let patterns = msg.patterns
        if (patterns.arguments) {
            msg.reply(patterns.arguments[0])
        }
    }
)

// в данном случае текст после слова "сложи" или "сумма"
// будет разделен запятой или пробелом
bot.command(
    "~(бот, )сложи|сумма [,| ]",
    msg => {
        let patterns = msg.patterns
        let args = patterns.args
        if (args) {
            if (args.every(v => Number(v)) {
                args = args.map(v => Number(v))
                msg.reply(args.reduce(a, b => a + b))
            }
        }
    }
) 
```

* ~ в начале выражения определяет, что команда не будет проверять регистр букв
* В скобках заключаются опциональные паттерны.
* В квадратных скобках заключаются списочные паттерны.
* В списочных паттернах указывается регулярное выражения разделения аргументов.
* Списочные паттерны ставятся в конце. В ином случае паттерны после списочного проверяться не будут.

**Продвинутые команды**

Чтобы добавить продвинутую команду в бота, нужно инициализировать новый объект команды и добавить его при помощи метода **.addCommand**.

```javascript
bot.addCommand(new Command("(выражение)", {
    caseSensitive?: true || false,
    // проверка на регистр букв
    argumentsCount?: true || int,
    // кол-во нужных аргументов
    access?: Function(responseObject),
    // функция проверки на доступ к команде
    patterns?: Array<Object>,
    // список готовых объектов паттернов
    callback: Function(responseObject)
    // код команды
})
```

# Клавиатура и кнопки

```javascript
const { Keyboard } = require('sodium-vk-api/lib')
```

Чтобы отправить клавиатуру, вам нужно включить в метод **.reply** сообщения объект клавиатуры.

https://vk.com/dev/bots_docs_3

## **Классы**

### **Карсас**

```javascript
let mainKeyboard = new Keyboard.Layout(buttons, options)
```

```javascript
bot.on('...', msg => {
    // ...
    msg.reply('...', {
        keyboard: mainKeyboard
    })
})
```

### Кнопка

Кнопки вкладываются в каркас сообщения. ****Чтобы создать новый ряд кнопок, добавьте их массив, или добавьте новую кнопку после массива или в начале списка кнопок.

```javascript
new Button(label, color, action)
```

```javascript
// Коды цветов:
// %primary, %secondary,
// %negative, %positive

let mk = new Keyboard.Layout(
    ['%primaryПодтвердить', '%negativeОтменить'],
    'Пересоздать'
, { inline: true })

let mk = new Keyboard.Layout(
    new Keyboard.Button('Заказать', 'primary', {
        type: 'callback',
        payload: '"command": {"order"}'
    })
, { inline: true })
```

## Колбек кнопки

Этот тип кнопок работает только на мобильных устройствах и уникален тем, что эти кнопки работают независимо, тоесть бот и пользователь могут не обмениваться сообщениями.

https://vk.com/dev/bots_docs_5

```javascript
let panel = new Keyboard.Layout(
    new Keyboard.Button('boot', false, {
        type: 'callback',
        payload: '"command": {"boot"}'
    },
    new Keyboard.Button('shutdown', false, {
        type: 'callback',
        payload: '"command": {"shutdown"}'
    },
    new Keyboard.Button('scan', false, {
        type: 'callback',
        payload: '"command": {"scan"}'
    },
    new Keyboard.Button('deploy', false, {
        type: 'callback',
        payload: '"command": {"deploy"}'
    }
)
```

При нажатии на кнопку бот получает событие **message\_event**, его можно обработать при помощи метода **.event**.

```javascript
bot.event('message_event', event => {
    console.log('Что-то было нажато!')
})
```

Но когда вам нужно обрабатывать поле **payload** - в дело вступают команды событий сообщения.

```javascript
const { MessageEventCommand } = require('sodium-vk-api')
// ...
bot.addMessageEventCommands(
    new MessageEventCommand(
        p => p.command == 'команда',
        // или
        'команда',
        // или
        [...'команда'],
    actionObject)
    // actionObject - действие после нажатия на кнопку.
    // см. документацию
)
```

# Сцены

Сцены используются для того, чтобы создать сценарий ответов пользователя на сообщения бота. Это может быть создание анкеты, настройка бота и много чего другого.

```javascript
const { Stage } = require('sodium-vk-api/lib')
```

Давайте рассмотрим один пример использования сцены и попробуем его разобрать.

```javascript
const { Stage, Keyboard } = require('sodium-vk-api/lib')
// ...
bot.on('~начать|создать', msg => {
    if (!db.data.userIds.includes(msg.from_id)) {
        let form = { name: false, age: false }
        let cancel = {
            keyboard: new Keyboard.Layout('Отмена')
        }
        msg.reply('Как вас зовут?', cancel)
        bot.addScene(new Stage(msg.from_id, [
            (msg, frames) => {
                if (!msg.text) {
                    msg.reply('Как вас зовут?', cancel)
                    frames.back()
                } else if (msg.text == 'Отмена') {
                    msg.reply('Создание анкеты отменено.')
                    frames.close()
                } else {
                    form.name = msg.text
                    msg.reply('Сколько вам лет?', cancel)
                    frames.next()
                }
            },
            (msg, frames) => {
                if (!msg.text || !Number(msg.text)) {
                    msg.reply('Как вас зовут?', cancel)
                    frames.back()
                } else if (msg.text == 'Отмена') {
                    msg.reply('Создание анкеты отменено.')
                    frames.close()
                } else {
                    form.age = Number(msg.text)
                    frames.close()
                }
            }
        ]))
        if (form.name && form.age) {
            db.edit('forms', forms => forms.push(form))
            msg.reply('Анкета создана!')
        }
    }
})
```

Чтобы добавить сцену в бота, мы воспользуемся методом **.addScene**.

```javascript
bot.addScene(new Stage(id, ...))
```

При создании новой сцены мы указываем айди пользователя и список фреймов. Если пользователь отправляет сообщения после инициализации сцены, то помимо команд сообщение передается в первый фрейм. Давайте рассмотрим, что можно делать во фрейме.

```javascript
new Stage(id, [
    // ... фреймы
    (msg, frames) => {
        // ...
        frames.next() // сдвигаемся к следующему
        frames.back() // сдвигаемся к предыдущему
        frames.skip(2) // пропускаем два
        frames.slideTo(0) // перемещаемся к первому
        frames.move(2) // сдвигаемся на два вперед
        frames.close() // закрываем сцену
    }
    // ... фреймы
])
```

При завершении сцены она удаляется из бота и больше не получает сообщения.

# Инструменты

В Sodium есть полезные инструменты, облегчающие работу с ботом.

## Работа с JSON

Теперь вы можете продвинуто работать с JSON, удобно получая данные и перезаписывая их, а также инициализируя модели в нем.

```javascript
const { Data } = require('sodium-vk-api/essentials')
```

Теперь укажем путь файлу и дефолтный каркас. Учтите, что нужно указывать только .json файлы.

```javascript
let db = new Data('./data.json', { users: {}, chats: {} })
```

### Чтение-запись

Чтобы получить любое поле из json файла, просто используйте поле .data и стандартный путь JS объекта.

```javascript
let name = db.data.users['bifot'].name
```

Чтобы изменить данные всего файла, используйте то же поле .data и присвойте ему объект.

```javascript
db.data = { users: {}, chats: {} } // wipe

// Можно избежать этой строки методом .wipe
db.wipe()
```

Если хотите отредактировать какое-то поле, используйте метод .edit.

```javascript
db.edit('users.soiran.name', name => 'Марк')
```

Если хотите проверить, существует ли какое-то поле, попробуйте метод .exists.

```javascript
db.exists('users.romiro27') // true || false
```

### Модели

Модели используются для добавления похожих по структуре объектов в json файл.

#### Инициализация

```javascript
// db.addModel(id, schema, options)
db.addModel('user', {
    nickname: v => v instanceof String,
    name: v => v instanceof String, // проверка на значение
    id: v => Number(v)
}, { keyField: 'nickname' }) // поле имени ключа
```

#### Добавление

```javascript
// db.new(id, path, struct)
db.new('user', 'users', {
    nickname: 'shirosakino',
    name: 'Сергей',
    id: 410685632
})
```

## Логгер

Красивый логгер для вашего кода. Просто инициализуйте новый объект с алиасом и используйте методы сообщений.

```javascript
const { Logger } = require('sodium-vk-api/essentials')
```

Создавая новый логгер - мы указываем алиас и цвет\(дефолтный синий\).

```javascript
var log = new Logger('Bot')
```

### Типы логов

Как говориться - на любой вкус и цвет.

```javascript
log.msg('Обычное сообщение')
log.info('Важная информация')
log.result('Результат процесса')
log.error('Ошибка')
log.warn('Предупреждение')
log.debug('Дебаг сообщение')
log.loading('Загрузка')
log.trace('Потоковая информация')
```