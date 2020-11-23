var inputForm = document.querySelector('form');
var inputTxt = document.querySelector('#textarea');
var voiceSelect = document.querySelector('select');

var pitch = document.querySelector('#pitch');
var pitchValue = document.querySelector('.pitch-value');
var rate = document.querySelector('#rate');
var rateValue = document.querySelector('.rate-value');
var volume = document.querySelector('#volume');
var volumeValue = document.querySelector('.volume-value');

var bou_com = document.querySelector('#bouyomi-com');

var voices = [];

function storeParams(name, kind, value) {
    var obj = {
        [prefix + name + kind] : value
    };
    browser.storage.local.set(obj);
}

pitch.onchange = function() {
    pitchValue.textContent = pitch.value;
    storeParams(voiceSelect.selectedOptions[0].getAttribute('data-name'), post_pitch, pitch.value);
}

rate.onchange = function() {
    rateValue.textContent = rate.value;
    storeParams(voiceSelect.selectedOptions[0].getAttribute('data-name'), post_rate, rate.value);
}

volume.onchange = function() {
    volumeValue.textContent = volume.value;
    storeParams(voiceSelect.selectedOptions[0].getAttribute('data-name'), post_volume, volume.value);
}

bou_com.onchange = function() {
    storeParams(bouyomi, post_handle, bou_com.checked);
}

function loadAdjustParams(name) {
    var pname = prefix + name;
    browser.storage.local.get({
        [pname + post_pitch]  : 1,
        [pname + post_rate]   : 1,
        [pname + post_volume] : 1,
        [prefix + bouyomi + post_handle] : true
    }, function(res) {
        pitch.value  = res[pname + post_pitch];
        rate.value   = res[pname + post_rate];
        volume.value = res[pname + post_volume];
        pitchValue.textContent = pitch.value;
        rateValue.textContent = rate.value;
        volumeValue.textContent = volume.value;
        bou_com.checked = res[prefix + bouyomi + post_handle];
    });
}


voiceSelect.onchange = function(){
    browser.storage.local.set({[voice_select] : voiceSelect.selectedOptions[0].getAttribute('data-name')});
    loadAdjustParams(voiceSelect.selectedOptions[0].getAttribute('data-name'));
}


function buildVoiceList() {
    var synth = window.speechSynthesis;
    voices = synth.getVoices().sort(function (a, b) {
        if ( a.name < b.name ) return -1;
        else if ( a.name == b.name ) return 0;
        else return +1;
    });
    browser.storage.local.get(voice_select,
                                function(res){
                                    var selectedIndex = voiceSelect.selectedIndex < 0 ? 0 : voiceSelect.selectedIndex;
                                    var set = false;
                                    voiceSelect.innerHTML = '';
                                    for(i = 0; i < voices.length ; i++) {
                                        var option = document.createElement('option');
                                        option.textContent = voices[i].name + ' (' + voices[i].lang + ')';
                                
                                        option.setAttribute('data-lang', voices[i].lang);
                                        option.setAttribute('data-name', voices[i].name);
                                        voiceSelect.appendChild(option);
                                        if(voices[i].name === res[voice_select]) {
                                            selectedIndex = i;
                                            set = true;
                                        }
                                    }
                                    var option = document.createElement('option');
                                    option.textContent = '棒読みちゃん (ja-JP)';
                                    option.setAttribute('data-lang', 'ja-JP');
                                    option.setAttribute('data-name', bouyomi);
                                    if(bouyomi === res[voice_select]) {
                                        selectedIndex = i;
                                        set = true;
                                    }
                                    voiceSelect.appendChild(option);
                                    voiceSelect.selectedIndex = selectedIndex;
                                    if(set) {
                                        loadAdjustParams(res[voice_select]);
                                    }
                                }
    );
}


buildVoiceList();
if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = buildVoiceList;
}


inputForm.onsubmit = function(event) {
    event.preventDefault();

    var index = voiceSelect.selectedIndex;
    var _pitch  = pitch.value;
    var _rate   = rate.value;
    var _volume = volume.value;
    var _com    = true;
    if(index >= voices.length) {
        bouyomiSynth([inputTxt.value], _pitch, _rate, _volume, _com);
    }
    else {
        makeSpeech(window.speechSynthesis, voices[index], [inputTxt.value], _pitch, _rate, _volume);
    }

    inputTxt.blur();
}

