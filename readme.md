Auto tezos reward distribution tool:
- Scan/calculate the rewards (uses https://api6.tzscan.io/v3 for data collecting)
- Intergrated telegram bot for message broadcasting after each unfrozen cycle.
- 2 operation modes: manually or auto reward distributing

© 2019 Copyright HyperBlocksPro, feel free to clone/use/copy
Website: https://hyperblocks.pro/
Telegram group: https://t.me/hyperblockspro

1. Setup
- Install the required packages: `npm i`
- Edit `config.txt` and `ignore.txt`:
config.txt: configure your baker address, commission fee, gas, telegram bot, schedule,...
ignore.txt: list of the delegators that will not be paid (in case you need)

2. Run
- `node .`

3. Use the bot
- set botToken in config.txt
- set notifyTo in config.txt
- `npm install pm2 -g`
- `pm2 start bot.js`
With this setting, you manually pay for each cycle, for auto pay, check the next part.

To customize schedule: Set values for `checkSchedule` and `timezone`, ie:

```
checkSchedule=00 09,16 * * *
timezone:Asia/Bangkok
```

* Note: each time you change `config.txt`, restart the bot `pm2 restart all` so the change can be applied

4. Turn on bot auto pay

In `config.txt` file, set values for `autopay` to `on` to enable auto mode, `off` to disable, `payAfter` mins, ie:
```
autopay=on
payAfter=60
```

The bot needs your password, so you need to execute `node encode` to get an encoded password.
Then, delete your old bot and create a new one.

```
pm2 ls
pm2 delete bot
```

Check to see if the bot is successfully deleted: `pm2 ls`.

Then add it again, provide the password (the output of `node encode` above).

```
pass=[EnterEncodedPass] pm2 start bot.js
```

This setting is for autopay

5. HyperBlocksPro is applied this for auto tezos reward distributing. If there is any issue in your operating, please report us. Thank you!