(function () {
  "use strict";

  var accountName;
  var background;
  var openInPopout;

  function numberWithCommas(x) {
    if (x < 1000) {
      return x;
    }

    return x.toLocaleString("en");
  }

  function onOptionsClick(e) {
    chrome.tabs.create({ url: "options.html" });
  }

  function onRefreshClick(e) {
    background.updateData();
    //todo: window.close();
  }

  function setErrorMessage(msg) {
    if (msg) {
      //need this slight delay, or else the html wont be displayed
      $("#errorContainer").show().html(msg);
    } else {
      $("#errorContainer").hide();
    }
  }

  function sortCategories(streams) {
    let gameHash = {};

    for (const stream of streams) {
      let game = stream.game_name;

      if (!game) {
        game = "Unknown";
      }

      if (!gameHash[game]) {
        gameHash[game] = [];
      }

      gameHash[game].push(stream);
    }

    let sortable = [];
    let key;
    for (key in gameHash) {
      if (gameHash.hasOwnProperty(key)) {
        sortable.push([key, gameHash[key]]);
      }
    }

    sortable.sort(function (_a, _b) {
      let a = _a[0].toUpperCase();
      let b = _b[0].toUpperCase();

      if (a > b) {
        return 1;
      }

      if (a < b) {
        return -1;
      }

      return 0;
    });

    return sortable;
  }

  function openURLInNewTab(url) {
    if (!url) {
      console.log("Error : url undefined.");
      return;
    }

    if (openInPopout) {
      url += "/popout";

      chrome.windows.create({
        url: url,
        focused: true,
        type: "popup",
      });
    } else {
      chrome.tabs.create({ url: url });
    }

    window.close();
  }

  function onChannelClick(e) {
    e.preventDefault();

    var url = unescape($(e.target).attr("data-url"));
    openURLInNewTab(url);
  }

  function onGameTitleClick(e) {
    e.preventDefault();

    var url = unescape($(e.target).attr("data-url"));

    url = "https://www.twitch.tv/directory/game/" + encodeURIComponent(url);
    openURLInNewTab(url);
  }

  function onTwitchClick(e) {
    e.preventDefault();
    openURLInNewTab("https://www.twitch.tv");
  }

  function updateView() {
    let streams = background.getStreams();

    let len = streams ? streams.length : 0;

    $(".streamDiv").unbind("click");
    $("#streamList").empty();

    if (!len) {
      $("#noStreamsDiv").show();
      return;
    } else {
      $("#noStreamsDiv").hide();
    }

    let sortedStreams = sortCategories(streams);
    let html = "";

    //for (let k = 0; k < sortLen; k++) {
    for (const category of sortedStreams) {
      //category = sortedStreams[k];
      let categoryName = category[0];

      html +=
        "<div class='streamSectionTitle' data-url=\"" +
        encodeURIComponent(categoryName) +
        '">' +
        categoryName +
        "</div>";

      let gameStreams = category[1];

      let gLen = gameStreams.length;
      let i;
      for (i = 0; i < gLen; i++) {
        let stream = gameStreams[i];

        let streamName = stream.user_name;

        //sometimes the user name is empty, so we will show the
        //login name for the streamer (usually the same just different case)
        if (streamName === undefined || streamName === "") {
          streamName = stream.user_login;
        }

        let url = "https://www.twitch.tv/" + encodeURI(stream.user_login);

        html +=
          '<div title="' +
          stream.title.replace(/"/g, "&quot;") +
          "\" class='streamDiv' data-url='" +
          escape(url) +
          "'>" +
          streamName +
          "<span class='channelCount'>" +
          numberWithCommas(stream.viewer_count) +
          "</span></a></div>";
      }

      html += "<div>&nbsp;</div>";
    }

    $("#streamList").append(html);

    //$(".channelLink").bind("click", onChannelClick);
    $(".streamDiv").bind("click", onChannelClick);

    $(".streamSectionTitle").bind("click", onGameTitleClick);
  }

  function onRefreshUp() {
    document.getElementById("refreshAnchor").classList.remove("refreshImgDown");
  }

  function onRefreshDown() {
    document.getElementById("refreshAnchor").classList.add("refreshImgDown");
  }

  $(document).ready(function () {
    $("#streamList").empty();
    $("#noStreamsDiv").hide();
    $("#errorContainer").hide();
    $("#optionsErrorDiv").hide();
    $("#refreshAnchor").bind("click", onRefreshClick);
    $("#twitchAnchor").bind("click", onTwitchClick);
    $("#optionsAnchor").bind("click", onOptionsClick);

    $("#refreshAnchor").bind("mousedown", onRefreshDown);
    $("#refreshAnchor").bind("mouseup mouseout", onRefreshUp);

    openInPopout = localStorage.openInPopout === "true";
    background = chrome.extension.getBackgroundPage();

    accountName = localStorage[background.USER_NAME_STORAGE_TOKEN];

    background.setPopup(window);

    let error = background.getErrorMessage();
    setErrorMessage(error);

    if (!accountName) {
      $("#optionsErrorDiv").show();
      return;
    }

    updateView();

    //this is required so we can get the mouse cursor to change on hover

    //hack to work around chrome extension bug that gives focus to the refreshAnchor
    setTimeout(function () {
      $("#refreshAnchor").blur();
    }, 100);
  });

  window.setErrorMessage = setErrorMessage;
  window.updateView = updateView;
})();
