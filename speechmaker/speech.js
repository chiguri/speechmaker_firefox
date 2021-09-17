const prefix = 'speech-maker-param-';
const bouyomi = 'BouyomiChan';
const voice_select = prefix + 'selected-voice';
const post_pitch  = '-pitch';
const post_rate   = '-rate';
const post_volume = '-volume';
const post_handle = '-command-handle';


function bouyomiSynth(texts, pitch, rate, volume, com) {
    // com = false : https://github.com/chocoa/BouyomiChan-WebSocket-Plugin を使用
    // com = true  : https://github.com/xztaityozx/BouyomiChan-WebSocket-Plugin を使用（ただしオリジナルはcommandの前に+が抜けている）
    // TODO : delimiterがtexts中に存在すると困るので処理する。"<bouyomi>" -> "< bouyomi >"くらい？
    // TODO : join時に先頭及びjoinの中身にVoiceroid Talk Plus用コマンドを追記する機能を付ける？（自分では使わないからよくわからない）
    // TODO : 文字列がある程度以上長くなる（ほぼ日本語で380文字程度、sendsが1000byteあたり）とwebsocketのバッファを溢れるのか処理に失敗する。
    const b_delim = "<bouyomi>";
    const b_command = 0x0001; // コマンドです。0x0001.読み上げ/0x0010.ポーズ/0x0020.再開/0x0030.スキップ（今回は読み上げのみ）
    var b_speed = Math.round(100*rate); // 速度50-200。-1を指定すると本体設定、整数以外受け付けない（以下同様）
    var b_pitch = Math.round(100*pitch); // ピッチ50-200。-1を指定すると本体設定
    var b_volume = Math.round(100*volume); // ボリューム0-100。-1を指定すると本体設定
    var b_type = 0; // 声質(0.本体設定/1.女性1/2.女性2/3.男性1/4.男性2/5.中性/6.ロボット/7.機械1/8.機械2)
    const b_text = texts.join("\n");

    // 送信文字列の作成
    const sends = com ? [ b_command, b_speed, b_pitch, b_volume, b_type, b_text ].join(b_delim)
                      : [ b_speed, b_pitch, b_volume, b_type, b_text ].join(b_delim);
        //"" + command + delim + speed + delim + pitch + delim + volume + delim + type + delim + text;
    //console.log(sends.length);
    //console.log(encodeURIComponent(sends).replace(/%../g,"x").length); 
    // 棒読みちゃんに送信　ポートは50002
    var socket = new WebSocket('ws://localhost:50002/');
    socket.onopen = function() {
        socket.send(sends);
    }
}


function makeSpeech(synth, voice, texts, pitch, rate, volume) {
    for(textnum = 0; textnum < texts.length; ++textnum) {
        const utterTexts = new SpeechSynthesisUtterance(texts[textnum]);
        const num = textnum;

        utterTexts.voice = voice;
        utterTexts.pitch = pitch;
        utterTexts.rate = rate;
        utterTexts.volume = volume;

        utterTexts.onend = function (event) {
            console.log("SpeechMaker : Finish " + num + "th-text speaking.");
        }
        utterTexts.onerror = function (event) {
            console.error("SpeechMaker : Errors occur while " + num + "th-text speaking.");
        }
        synth.speak(utterTexts);
    }
}


function splitToSentences(text, sw) {
    if(sw == 0) { // JP
        return text.replace(/\n/g,'').replace(/[。．：；]/g,'$&\n').split(/\n/).filter(str => str !== "");
    }
    // currently, only EN is expected (I don't know what is used as marks for ends of sentences in other languages)
    return text.replace(/\n/g,' ').replace(/  /g,' ').replace(/[.:;]/g,'$&\n').split(/\n/).filter(str => str !== "");
}

function selectLang(lang) {
    if(lang === 'ja-JP') return 0; // TODO 正規表現などの方が良い？
    return 1;
}


function textSpeech(text, name) {
    const pname = prefix + name;
    //console.log("SpeechMaker (Text Info): " + text);

    if(name === bouyomi) {
        const texts = splitToSentences(text, 0); // texts are expected as JP
        if(texts.length <= 0) {
            console.log("SpeechMaker : Text is empty, skip.");
            return;
        }

        browser.storage.local.get({
            [pname + post_pitch]  : 1,
            [pname + post_rate]   : 1,
            [pname + post_volume] : 1,
            [pname + post_handle] : true
        }, function(res) {
            var pitch  = res[pname + post_pitch];
            var rate   = res[pname + post_rate];
            var volume = res[pname + post_volume];
            var com    = res[pname + post_handle];
            console.log("SpeechMaker (Voice Info) : BouyomiChan");
            bouyomiSynth(texts, pitch, rate, volume, com);
        });
        return;
    }

    var synth = window.speechSynthesis;
    var voices = synth.getVoices();
    // 要voice選択などの情報取得
    var voice_candidate = null;
    for(var i = 0; i < voices.length ; i++) {
        if(voices[i].name === name) {
            voice_candidate = voices[i];
            break;
        }
    }
    const voice = voice_candidate;
    if(voice == null) {
        console.error("SpeechMaker (Voice Info) : Voice is not set (or removed after setting), abort.");
        return;
    }

    const texts = splitToSentences(text, selectLang(voice.lang)); // TODO : textから言語を調べる、とか？

    browser.storage.local.get({
        [pname + post_pitch]  : 1,
        [pname + post_rate]   : 1,
        [pname + post_volume] : 1
    }, function(res) {
        var pitch  = res[pname + post_pitch];
        var rate   = res[pname + post_rate];
        var volume = res[pname + post_volume];

        console.log("SpeechMaker (Voice Info) : " + voice.name + " (" + voice.lang + ")");
        makeSpeech(synth, voice, texts, pitch, rate, volume);
    });
}


function cancelSpeech(name) {
    if(name === bouyomi) {
        browser.storage.local.get({
            [prefix + name + post_handle] : true
        }, function(res) {
            var com = res[prefix + name + post_handle];
            if(com) {
                // TODO : キャンセルがない...
            }
        });
    }
    else {
        window.speechSynthesis.cancel();
    }
}

