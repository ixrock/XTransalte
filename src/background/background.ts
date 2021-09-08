//-- Background page

// import "crx-hotreload"
import "../packages.setup";
import "./contextMenu"
import { isProduction } from "../common-vars";
import { MessageType, onAppInstall, onMessageType, PlayTextToSpeechPayload, TranslatePayload, TranslatePayloadResult } from '../extension'
import { getTranslator, ITranslationResult, playText, stopPlayingAll } from "../vendors";
import { rateLastTimestamp } from "../components/app/app-rate.dialog";
import { settingsStore } from "../components/settings/settings.storage";
import { importHistory } from "../components/user-history/history.storage";
import { defaultPageId, navigate } from "../navigation";

// TODO: integrate with https://www.deepl.com/pro-account/summary (free subscription >up to 500_000 chars)
// TODO: multi language-selector + favorites list (?)

onAppInstall(reason => {
  if (reason === "install" || !isProduction) {
    rateLastTimestamp.set(Date.now());
    navigate({ page: defaultPageId }).catch(Function);
  }
});

// Handle IPC for background process <-> options-page <-> content-script (browser pages)
onMessageType<TranslatePayload>(MessageType.TRANSLATE_TEXT, async (message, sender, sendResponse) => {
  const { vendor, from, to, text } = message.payload;
  const request = getTranslator(vendor).getTranslation(from, to, text);

  const response: TranslatePayloadResult = await request
    .then(data => ({ data }))
    .catch(error => ({ error }));

  request.then(async (translation: ITranslationResult) => {
    var { autoPlayText, historyEnabled } = settingsStore.data;
    if (autoPlayText) {
      let { vendor, originalText, langFrom, langDetected = langFrom } = translation;
      playText({ vendor, text: originalText, lang: langDetected });
    }
    if (historyEnabled) {
      await importHistory(translation);
    }
  });

  sendResponse<TranslatePayloadResult>(response);
});

onMessageType<PlayTextToSpeechPayload>(MessageType.TTS_PLAY, ({ payload }) => {
  playText(payload);
});

onMessageType(MessageType.TTS_STOP, () => {
  stopPlayingAll();
});
