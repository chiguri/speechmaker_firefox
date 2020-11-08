browser.contextMenus.create({
    id: "speech-maker",
    type: "normal",
    title: "Speech Synthesis", // 読み上げ、とかの方がいいだろうか
    contexts: ["selection"],
});


browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "speech-maker") {
        browser.storage.local.get('selectedvoice',
                                    function(res) {
                                        textSpeech(info.selectionText, res['selectedvoice']); // default動作がほしい？
                                    });
    }
});

