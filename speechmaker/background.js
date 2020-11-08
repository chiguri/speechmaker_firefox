browser.contextMenus.create({
    id: "speech-maker",
    type: "normal",
    title: "Speech Synthesis", // 読み上げ、とかの方がいいだろうか
    contexts: ["selection"],
});


function textSpeaker(text) {
    var synth = window.speechSynthesis;
    var voices = synth.getVoices();
    // 要voice選択などの情報取得
    var voice = voices[0];
    for(var i = 0; i < voices.length ; i++) {
        if(voices[i].lang === "ja-JP") {
            voice = voices[i];
            break;
        }
    }
    var pitch = 1;
    var rate = 1;
    var volume = 1;
    // bouyomichan対応？
    
    console.log("SpeechMaker (Voice Info) : " + voice.name + " (" + voice.lang + ")");
    console.log("SpeechMaker (Text Info): " + info.selectionText);
    const texts = text.replace(/\n/,'').split(/[。．：；]/).filter(str => str !== ""); // 要調整、句点は残す方法を探した方が良いかも。
    console.log("SpeechMaker (Splitted Texts): " + texts);

    var textnum = 0;
    if(textnum >= texts.length) {
        console.log("SpeechMaker : Text is empty, so skip.")
        return;
    }
    if(voice.name === "BouyomiChan") {
        // https://github.com/xztaityozx/BouyomiChan-WebSocket-Plugin よりサンプルを抜粋（ただしオリジナルはcommandの前に+が抜けている）
        // 元である https://github.com/chocoa/BouyomiChan-WebSocket-Plugin はcommandがないので対応するなら出力を書き換える必要がある
        // TODO : delimiterがtexts中に存在すると困るので処理する。"<bouyomi>" -> "< bouyomi >"くらい？
        // TODO : join時に先頭及びjoinの中身にVoiceroid Talk Plus用コマンドを追記する機能を付ける？（自分では使わないからよくわからない）
        const b_delim = "<bouyomi>";
        const b_command = 0x0001; // コマンドです。0x0001.読み上げ/0x0010.ポーズ/0x0020.再開/0x0030.スキップ（今回は読み上げのみ）
        var b_speed = 100*rate; // 速度50-200。-1を指定すると本体設定
        var b_pitch = 100*pitch; // ピッチ50-200。-1を指定すると本体設定
        var b_volume = 100*volume; // ボリューム0-100。-1を指定すると本体設定
        var b_type = 0; // 声質(0.本体設定/1.女性1/2.女性2/3.男性1/4.男性2/5.中性/6.ロボット/7.機械1/8.機械2)
        const b_text = texts.join("\n");

        // 送信文字列の作成
        const sends = [b_command, b_speed, b_pitch, b_volume, b_type, b_text ].join(b_delim);
            //"" + command + delim + speed + delim + pitch + delim + volume + delim + type + delim + text;

        // 棒読みちゃんに送信　ポートは50002
        var socket = new WebSocket('ws://localhost:50002/');
        socket.onopen = function() {
            socket.send(sends);
        }
        return;
    }

    const utterTexts = new SpeechSynthesisUtterance(texts[textnum]);

    utterTexts.voice = voice;
    utterTexts.pitch = pitch;
    utterTexts.rate = rate;

    if(synth.speaking) {
        console.log("SpeechMaker : Speaking now, please wait..."); // 時間稼ぎして再開した方が？
        return;
    }
    utterTexts.onend = function (event) {
        console.log("SpeechMaker : Finish " + textnum + "th-text speaking.");
        if(++textnum >= texts.length) {
            console.log("SpeechMaker : Finish speaking all texts.")
            return;
        }
        utterTexts.text = texts[textnum];
        synth.speak(utterTexts);
    }
    utterTexts.onerror = function (event) {
        console.error("SpeechMaker : Errors occur while text speaking.");
    }
    synth.speak(utterTexts);
}


browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "speech-maker") {
        textSpeaker(info.selectionText);
    }
});

