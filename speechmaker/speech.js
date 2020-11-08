function bouyomiSynth(texts, pitch, rate, volume) {
    // https://github.com/xztaityozx/BouyomiChan-WebSocket-Plugin よりサンプルを抜粋（ただしオリジナルはcommandの前に+が抜けている）
    // 元である https://github.com/chocoa/BouyomiChan-WebSocket-Plugin はcommandがないので対応するなら出力を書き換える必要がある
    // TODO : delimiterがtexts中に存在すると困るので処理する。"<bouyomi>" -> "< bouyomi >"くらい？
    // TODO : join時に先頭及びjoinの中身にVoiceroid Talk Plus用コマンドを追記する機能を付ける？（自分では使わないからよくわからない）
    const b_delim = "<bouyomi>";
    const b_command = 0x0001; // コマンドです。0x0001.読み上げ/0x0010.ポーズ/0x0020.再開/0x0030.スキップ（今回は読み上げのみ）
    var b_speed = Math.round(100*rate); // 速度50-200。-1を指定すると本体設定、整数以外受け付けない（以下同様と思われる）
    var b_pitch = Math.round(100*pitch); // ピッチ50-200。-1を指定すると本体設定
    var b_volume = Math.round(100*volume); // ボリューム0-100。-1を指定すると本体設定
    var b_type = 0; // 声質(0.本体設定/1.女性1/2.女性2/3.男性1/4.男性2/5.中性/6.ロボット/7.機械1/8.機械2)
    const b_text = texts.join("\n");

    // 送信文字列の作成
    const sends = [b_command, b_speed, b_pitch, b_volume, b_type, b_text ].join(b_delim);
        //"" + command + delim + speed + delim + pitch + delim + volume + delim + type + delim + text;
    //console.log(sends);
    // 棒読みちゃんに送信　ポートは50002
    var socket = new WebSocket('ws://localhost:50002/');
    socket.onopen = function() {
        socket.send(sends);
    }
}

function makeSpeech(synth, voice, texts, pitch, rate, volume) {
    var textnum = 0;
    const utterTexts = new SpeechSynthesisUtterance(texts[textnum]);

    utterTexts.voice = voice;
    utterTexts.pitch = pitch;
    utterTexts.rate = rate;
    utterTexts.volume = volume;

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

function loadParams(name) {
    var obj = {};
}


function textSpeech(text, name) {
    //console.log("SpeechMaker (Text Info): " + text);
    const texts = text.replace(/\n/,'').split(/[。．：；]/).filter(str => str !== ""); // 要調整、改行を残したり、句点は残す方法を探した方が良いかも。
    //console.log("SpeechMaker (Splitted Texts): " + texts);
    if(texts.length <= 0) {
        console.log("SpeechMaker : Text is empty, skip.");
        return;
    }

    var synth = window.speechSynthesis;
    var voices = synth.getVoices();
    // 要voice選択などの情報取得
    var voice = null;
    for(var i = 0; i < voices.length ; i++) {
        if(voices[i].name === name) {
            voice = voices[i];
            break;
        }
    }

    if(name !== "BouyomiChan" && voice == null) {
        console.error("SpeechMaker (Voice Info) : Voice is not set (or removed after setting), abort.");
        return;
    }
    var pitch = 1;
    var rate = 1;
    var volume = 1;

    browser.storage.local.get({
        [name + 'pitch']  : 1,
        [name + 'rate']   : 1,
        [name + 'volume'] : 1
    }, function(res) {
        var pitch  = res[name+'pitch'];
        var rate   = res[name+'rate'];
        var volume = res[name+'volume'];

        if(name === "BouyomiChan") {
            console.log("SpeechMaker (Voice Info) : BouyomiChan");
            bouyomiSynth(texts, pitch, rate, volume);
        }
        else {
            console.log("SpeechMaker (Voice Info) : " + voice.name + " (" + voice.lang + ")");
            makeSpeech(synth, voice, texts, pitch, rate, volume);
        }
    });
}
