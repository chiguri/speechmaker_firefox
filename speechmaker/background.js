browser.contextMenus.create({
    id: "speech-maker-synth",
    type: "normal",
    title: "Speech Synthesis", // 読み上げ、とかの方がいいだろうか
    contexts: ["selection"],
});
/*
browser.contextMenus.create({
    id: "speech-maker-cancel",
    type: "normal",
    title: "Speech Cancel",
    contexts: ["selection"],
});
*/


browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "speech-maker-synth") {
        browser.storage.local.get(voice_select,
                                    function(res) {
                                        textSpeech(info.selectionText, res[voice_select]); // default動作がほしい？
                                    });
    }
    else if (info.menuItemId === "speech-maker-cancel") {
        browser.storage.local.get(voice_select,
                                    function(res) {
                                        cancelSpeech(res[voice_select]); // default動作がほしい？
                                    });
    }
});

