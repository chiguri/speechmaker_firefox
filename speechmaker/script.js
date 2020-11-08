var inputForm = document.querySelector('form');
var inputTxt = document.querySelector('input');
var voiceSelect = document.querySelector('select');

var pitch = document.querySelector('#pitch');
var pitchValue = document.querySelector('.pitch-value');
var rate = document.querySelector('#rate');
var rateValue = document.querySelector('.rate-value');
var volume = document.querySelector('#volume');
var volumeValue = document.querySelector('.volume-value');

var voices = [];

function storeParams(kind, value) {
    var obj = {
        [voiceSelect.selectedOptions[0].getAttribute('data-name') + kind] : value
    };
    browser.storage.local.set(obj);
}

pitch.onchange = function() {
    pitchValue.textContent = pitch.value;
    storeParams('pitch', pitch.value);
}

rate.onchange = function() {
    rateValue.textContent = rate.value;
    storeParams('rate', rate.value);
}

volume.onchange = function() {
    volumeValue.textContent = volume.value;
    storeParams('volume', volume.value);
}


function loadAdjustParams(name) {
    browser.storage.local.get({
        [name + 'pitch']  : 1,
        [name + 'rate']   : 1,
        [name + 'volume'] : 1
    }, function(res) {
        pitch.value  = res[name+'pitch'];
        rate.value   = res[name+'rate'];
        volume.value = res[name+'volume'];
        pitchValue.textContent = pitch.value;
        rateValue.textContent = rate.value;
        volumeValue.textContent = volume.value;
    });
}


voiceSelect.onchange = function(){
    browser.storage.local.set({selectedvoice : voiceSelect.selectedOptions[0].getAttribute('data-name')});
    loadAdjustParams(voiceSelect.selectedOptions[0].getAttribute('data-name'));
}



function buildVoiceList() {
    var synth = window.speechSynthesis;
    voices = synth.getVoices().sort(function (a, b) {
        if ( a.name < b.name ) return -1;
        else if ( a.name == b.name ) return 0;
        else return +1;
    });
    browser.storage.local.get('selectedvoice',
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
                                        if(voices[i].name === res['selectedvoice']) {
                                            selectedIndex = i;
                                            set = true;
                                        }
                                    }
                                    var option = document.createElement('option');
                                    option.textContent = '棒読みちゃん (ja-JP)';
                                    option.setAttribute('data-lang', 'ja-JP');
                                    option.setAttribute('data-name', 'BouyomiChan');
                                    if('BouyomiChan' === res['selectedvoice']) {
                                        selectedIndex = i;
                                        set = true;
                                    }
                                    voiceSelect.appendChild(option);
                                    voiceSelect.selectedIndex = selectedIndex;
                                    if(set) {
                                        loadAdjustParams(res['selectedvoice']);
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
    if(index >= voices.length) {
        bouyomiSynth([inputTxt.value], _pitch, _rate, _volume);
    }
    else {
        makeSpeech(window.speechSynthesis, voices[index], [inputTxt.value], _pitch, _rate, _volume);
    }

    inputTxt.blur();
}

