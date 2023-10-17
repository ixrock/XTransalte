//-- Main window app (options page)

import "./app.scss";
import "../../setup";
import * as React from 'react';
import { createRoot } from "react-dom/client"
import { reaction } from "mobx";
import { observer } from "mobx-react";
import { preloadAppData } from "../../preloadAppData";
import { getManifest } from "../../extension";
import { settingsStore } from '../settings/settings.storage'
import { Header } from "./header";
import { Footer } from './footer'
import { Spinner } from "../spinner";
import { Notifications } from "../notifications";
import { defaultPageId, getParam } from "../../navigation";
import { pageManager } from "./page-manager";
import { DonationDialog } from "./donation-dialog";
import { ExportImportSettingsDialog } from "./export-settings-dialog";
import { PrivacyDialog } from "./privacy-dialog";
import { AppRateDialog } from "./app-rate.dialog";
import { dialogsState } from "./dialogs-state";
import { showPrivacyDialog, takeAdsConfig } from "../../../takeads/init";

@observer
export class App extends React.Component {
  static async init(preloadDeps: () => Promise<void>) {
    // preload dependent data before initial app rendering
    await preloadDeps();
    await takeAdsConfig.load();

    const { name: appName, description: appDescription } = getManifest();
    document.title = `${appName} - ${appDescription}`;

    var rootElem = document.getElementById('app');
    var rootNode = createRoot(rootElem);
    rootNode.render(<Spinner center/>); // show loading indicator

    App.bindDarkThemeSwitching();
    rootNode.render(<App/>);
  }

  static bindDarkThemeSwitching() {
    return reaction(() => settingsStore.data.useDarkTheme, isDark => {
      document.documentElement.dataset.theme = isDark ? "dark" : "light";
    }, {
      fireImmediately: true,
    })
  };

  render() {
    const pageId = getParam("page", defaultPageId);
    const { Page } = pageManager.getComponents(pageId);

    return (
      <div className="App">
        <Header/>
        <div
          className="PageContent"
          children={Page ? <Page/> : <p className="notFound">Page not found</p>}
        />
        <Footer/>
        <Notifications/>
        <DonationDialog
          isOpen={dialogsState.showDonationDialog}
          onClose={() => dialogsState.showDonationDialog = false}
        />
        <ExportImportSettingsDialog
          isOpen={dialogsState.showImportExportDialog}
          onClose={() => dialogsState.showImportExportDialog = false}
        />
        <PrivacyDialog
          isOpen={showPrivacyDialog.get()}
          onTermsAccepted={() => showPrivacyDialog.set(false)}
        />
        <AppRateDialog/>
      </div>
    );
  }
}

// render app
App.init(preloadAppData);
