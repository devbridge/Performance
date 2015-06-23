angular.module('SpeedTestViewModule', ['angularCharts', 'ngSanitize']).controller('SpeedTestResultsControler', ['$scope', 'SpeedTestService', 'ngDialog', '$sce', '$compile', '$location',
            function SpeedTestResultsControler($scope, SpeedTestService, ngDialog, $sce, $compile, $location) {
              this.SearchFilter ='';
              this.OrderBy ='';
              this.MinimumPassScore =80;
              this.ShowDesktop = true;
              this.ShowMobile = false;
              this.ShowPerfChart = true;
              this.ShowMainTable = false;
              this.SpeedTests = {};
              this.SiteUrl = SpeedTestService.SiteUrl;
              this.SpeedTests.oldResults = SpeedTestService.SpeedTestResults.oldresults;
              this.SpeedTests.newResults = SpeedTestService.SpeedTestResults.newresults;
              var mainScope = this,
                  webPages = null,
                  localStorageSettingsKey = 'Speed test page local storage key',
                  defaultConfig = ['desktop.ruleGroups.SPEED.score',
                                    'mobile.ruleGroups.SPEED.score',
                                    'desktop.ruleGroups.SPEED.score',
                                    'mobile.ruleGroups.SPEED.score',
                                    'devperf.notFound',
                                    'devperf.imageSize',
                                    'devperf.imageCount',
                                    'devperf.jsErrors',
                                    'devperf.DOMqueries',
                                    'devperf.jQuerySizzleCalls',
                                    'devperf.timeFrontend',
                                    'devperf.timeToLastByte',
                                    'devperf.notFound',
                                    'devperf.imageSize',
                                    'devperf.imageCount',
                                    'devperf.jsErrors',
                                    'devperf.DOMqueries',
                                    'devperf.jQuerySizzleCalls',
                                    'devperf.timeFrontend',
                                    'devperf.timeToLastByte',
                                    'html.context'],
                  sizesTableConfig = ["devperf.cssCount",
                                      "devperf.cssSize",
                                      "devperf.jsCount",
                                      "devperf.jsSize",
                                      "devperf.webfontCount",
                                      "devperf.webfontSize"];

              this.ChartData = {
                desktop:{
                  data: []
                },
                mobile:{
                  data: []
                }
              };

              this.Fillters = [];

              this.TableData = [];
              this.TableLabels = [];

              this.SizesTableData = [];
              this.SizesTableLabels = [];

              function MakeNamePretty(name){
                if (SpeedTestService.Settings.translations[name] !== undefined) {
                  return SpeedTestService.Settings.translations[name];
                } else {
                  var splittedName = name.split('.');
                  function HandleWords(word) {
                    return word[0].toUpperCase()+word.substring(1);
                  }
                  function AddNames(arr, name, depth) {
                    if (arr.length == 0 || depth < 1) {
                      return name;
                    }
                    return AddNames(arr, name+' '+HandleWords(arr.pop()), --depth);
                  }

                  return AddNames(splittedName, HandleWords(splittedName.shift()), 2);
                }
              }

              function SaveConfiguration() {
                var cfg = [],
                    arr = mainScope.Fillters.filter(function(a){return a.Value;});
                if (arr == null || arr.length == 0) {
                  localStorage.setItem(localStorageSettingsKey, JSON.stringify(defaultConfig));
                } else {
                  for (var i = 0; i < arr.length; i++) {
                    cfg.push(arr[i].Name);
                  };
                  localStorage.setItem(localStorageSettingsKey, JSON.stringify(cfg));
                }
              }

              this.SetCustomTableData = function (filters) {
                var customTableData = [];
                var resultsToGet = filters.filter(function (value, index, self) { return value.Value; });
                var webSites = this.ReturnWebsiteKeys();
                // websites - /, /products...
                for (var i = 0; i < webSites.length; i++) {
                  var tableItem = {Name:webSites[i].replace(SpeedTestService.SiteUrl, "")};
                  // resultsToGet - example desktop.speed.result.score, devperf.fastestResponse
                  for (var j = 0; j < resultsToGet.length; j++) {
                    var path = resultsToGet[j].Name.split('.');
                    tableItem[resultsToGet[j].Name] = {};
                    if (this.SpeedTests.oldResults !== null &&
                      this.SpeedTests.oldResults[path[0]] &&
                      this.SpeedTests.oldResults[path[0]][webSites[i]] !== undefined){
                      tableItem[resultsToGet[j].Name].old = GetValue(this.SpeedTests.oldResults[path.shift()][webSites[i]], path);
                    }
                    path = resultsToGet[j].Name.split('.');
                    if (this.SpeedTests.newResults !== null &&
                      this.SpeedTests.newResults[path[0]] &&
                      this.SpeedTests.newResults[path[0]][webSites[i]] !== undefined){
                      tableItem[resultsToGet[j].Name].new = GetValue(this.SpeedTests.newResults[path.shift()][webSites[i]], path);
                    }
                  };
                  customTableData.push(tableItem);
                }
                return customTableData;

                function GetValue(object, path) {
                  var element = path.shift();
                  if (element !== undefined && object[element] !== undefined) {
                    return GetValue(object[element], path);
                  }
                  return object;
                }
              };

              this.ReturnWebsiteKeys = function () {
                if (webPages == null) {
                  webPages = [];
                  // new or old results
                  for (var resultsKey in SpeedTestService.SpeedTestResults) {
                    // desktop, mobile or devperf
                    for (var typeKey in SpeedTestService.SpeedTestResults[resultsKey]) {
                      for (var webSite in SpeedTestService.SpeedTestResults[resultsKey][typeKey]) {
                        webPages.push(webSite);
                      }
                    }
                  }
                  webPages = webPages.filter(function (value, index, self) { return self.indexOf(value) === index; });
                }
                return webPages;
              };

              this.SetChartData = function() {
                var types = ['mobile', 'desktop'],
                    webSites = this.ReturnWebsiteKeys(),
                    num;
                for (var i = 0; i < types.length; i++) {
                  num = 0;
                  for (var j = 0; j < webSites.length; j++) {
                    var page = {scores:{}};
                    page.Name = webSites[j].replace(SpeedTestService.SiteUrl, "");
                    if (this.SpeedTests.newResults[types[i]] !== null &&
                      this.SpeedTests.newResults[types[i]][webSites[j]] !== undefined) {
                      page.scores.new = this.SpeedTests.newResults[types[i]][webSites[j]].ruleGroups.SPEED.score;
                    } else {
                      page.scores.new=0;
                    }
                    if (this.SpeedTests.oldResults[types[i]] !== null &&
                      this.SpeedTests.oldResults[types[i]][webSites[j]] !== undefined) {
                      page.scores.old = this.SpeedTests.oldResults[types[i]][webSites[j]].ruleGroups.SPEED.score;
                    } else {
                      page.scores.old=0;
                    }
                    this.ChartData[types[i]].data.push(page);
                  }
                }
              };

              this.Sort = function(arr, label) {
                if (this.OrderBy == label) {
                  arr.reverse();
                } else {
                  arr.sort(function(a,b){
                    if (label == 'Name') {
                      return -1*(a[label] === undefined ? -1 : b[label] === undefined ? 1 : a[label]>b[label] ? 1:-1);
                    } else {
                      return -1*(a[label] === undefined ? -1 : b[label] === undefined ? 1 : a[label].new>b[label].new ? 1:-1);
                    }
                  });
                }
                this.OrderBy = label;
              };

              this.GetTableLabels = function(tableData) {
                var labels=[];
                for(var line in tableData) {
                  for(var key in tableData[line]) {
                    labels.push(key);
                  }
                }
                labels = labels.filter(function (value, index, self) { return self.indexOf(value) === index; });
                var prettyLabels = [];
                for (var i = 0; i < labels.length; i++) {
                  if (SpeedTestService.Settings.translations[labels[i]] !== false) {
                    prettyLabels.push({Name:labels[i], PrettyName:MakeNamePretty(labels[i])});
                  }
                  if (labels[i].indexOf('.ruleGroups.SPEED.score')>0 && labels.indexOf('html.context')>-1) {
                    labels[labels.indexOf('html.context')] = ' ';
                    prettyLabels.push({Name:'html.context', PrettyName:MakeNamePretty('html.context')});
                  }
                };
                if (SpeedTestService.Settings.logFilterKeys) {
                  console.log(labels);
                }
                return prettyLabels;
              };

              this.LoadFilters = function() {
                var arr = [];
                // type - new old results
                for (var type in this.SpeedTests) {
                  // strategy - mobile, desktop or devperf
                  for (var strategy in this.SpeedTests[type]) {
                    // webSite - /, /products, /about...
                    for (var webSite in this.SpeedTests[type][strategy]) {
                      if (this.SpeedTests[type][strategy] !== undefined) {
                        for (var key in this.SpeedTests[type][strategy][webSite]){
                          ColectKeys(arr, strategy, this.SpeedTests[type][strategy][webSite]);
                          arr = arr.filter(function (value, index, self) { return self.indexOf(value) === index; });
                        }
                      }
                    }
                  }
                }
                arr = arr.filter(function (value, index, self) { return self.indexOf(value) === index; });
                this.Fillters = [];
                for (var i = 0; i < arr.length; i++) {
                  if (SpeedTestService.Settings.translations[arr[i]] !== false) {
                    mainScope.Fillters.push({Name:arr[i], PrettyName:MakeNamePretty(arr[i]),Value:false});
                  }
                };

                function ColectKeys(array, prefix, branch) {
                  if (typeof branch == 'object') {
                    if (branch.length === undefined) {
                      for (var leaf in branch) {
                        ColectKeys(array, prefix+'.'+leaf, branch[leaf]);
                      }
                    }
                  } else if (typeof branch == 'string' || typeof branch == 'number') {
                    array.push(prefix);
                  }
                }
              };

              this.ScorePassed = function(score, label){
                return label.Name.indexOf('ruleGroups.SPEED.score.new') > -1 && score < this.MinimumPassScore;
              };

              this.UpdateData = function() {
                this.TableData = this.SetCustomTableData(this.Fillters);
                this.TableLabels = this.GetTableLabels(this.TableData);
                SaveConfiguration();
              };

              this.LoadConfig = function(config) {
                for (var i = 0; i < config.length; i++) {
                  for (var j = 0; j < mainScope.Fillters.length; j++) {
                    if (mainScope.Fillters[j].Name == config[i]) {
                      mainScope.Fillters[j].Value = true;
                      j = mainScope.Fillters.length;
                    }
                  };
                };
              };

              this.ClearFilters = function () {
                for (var i = 0; i < this.Fillters.length; i++) {
                  this.Fillters[i].Value = false;
                };
              };

              this.GetGoogleAdvices = function(type) {
                if (this.SpeedTests.newResults !== undefined) {
                  if (this.SpeedTests.newResults[type] !== undefined) {
                    if (this.SpeedTests.newResults[type][this.ModalWebPageKey] !== undefined) {
                      return this.SpeedTests.newResults[type][this.ModalWebPageKey].formattedResults.ruleResults;
                    }
                  }
                }
                return {};
              };

              this.OpenGoogleSpeedInsightsAdvicesModal = function(page, type) {
                this.ShowDesktop = type == 'desktop';
                this.ShowMobile = type == 'mobile';
                this.ModalWebPageKey = SpeedTestService.SiteUrl+page;
                ngDialog.open({
                  template: 'dialogTemplate.html',
                  scope: $scope
                });
              };

              this.OpenHtmlValidityModal = function(page) {
                this.ModalWebPageKey = SpeedTestService.SiteUrl+page;
                ngDialog.open({
                  template: 'htmlValidityTemplate.html',
                  scope: $scope
                });
              };

              this.GetHtmlPageErrors = function() {
                var report = this.SpeedTests.newResults.html[this.ModalWebPageKey];
                if (report) {
                  return report.messages;
                }
                return null;
              };

              // must return some kind of html cause it is rendered later on as html
              this.HandleTableValues = function(page, label) {
                if (label.Name == 'html.context') {
                  var report = this.SpeedTests.newResults.html[SpeedTestService.SiteUrl+page.Name];
                  if (report) {
                    return '<button class="button-link has-html-errors" ng-click="firstCtrl.OpenHtmlValidityModal(page.Name)" type="button"><i class="fa fa-exclamation-triangle"></i> Errors ('+report.messages.length+')</button>';
                  } else if (report && report.messages.length == 0) {
                    return '<span class="no-html-errors status-new">No Errors</span>'
                  } else if (!report) {
                    return '<span>No data</span>'
                  }
                }
                if (label.Name == 'Name') {
                  return '<a href="'+this.SiteUrl+page.Name+'" target="_blank">'+page.Name.replace(this.SiteUrl, '')+'</a>';
                }
                if (label.Name == 'desktop.ruleGroups.SPEED.score') {
                  var score = page['desktop.ruleGroups.SPEED.score'];
                  if(score.new >= this.MinimumPassScore) {
                    return '<span class="status-positive">' + page['desktop.ruleGroups.SPEED.score'].new + '</span>';
                  } else {
                    return '<span class="status-negative">' + page['desktop.ruleGroups.SPEED.score'].new + '</span>';
                  }
                }
                var content = page[label.Name],
                  tableLine = '<span></span>';
                if (content) {
                  if (content.old !== undefined) {
                    tableLine += '<span class="status-old">'+content.old+'</span>';
                  }
                  if (content.old !== undefined && content.new !== undefined) {
                    tableLine += '<br>';
                  }
                  if (content.new !== undefined) {
                    tableLine += '<span class="status-new">'+content.new+'</span>';
                  }
                }
                return tableLine;
              };

              this.ShowTableElement = function(label){
                if (this.ShowDesktop) {
                  if (label.indexOf('desktop') == 0 || label.indexOf('mobile') != 0) {
                    return true;
                  } else {
                    return false;
                  }
                }
                if (this.ShowMobile) {
                  if (label.indexOf('mobile') == 0 || label.indexOf('desktop') != 0) {
                    return true;
                  } else {
                    return false;
                  }
                }
                return true;
              };

              this.Page = function(page){
                if (page !== undefined) {
                  $location.search('page', page);
                }
                if ($location.$$search['page']=='performance-chart') {
                  this.ShowPerfChart = true;
                  this.ShowMainTable = false;
                }
                if ($location.$$search['page']=='main-table') {
                  this.ShowPerfChart = false;
                  this.ShowMainTable = true;
                }
              };

              this.uiStickyElements = function () {
                $(window).on('scroll resize', function (event) {
                  var scrollTop = $(window).scrollTop();
                  $(".js-keep-in-right").css("left", $(window).scrollLeft() + $(window).outerWidth());

                  if(scrollTop < 55) {
                    $(".js-sticky-header")
                        .css("margin-top", "-" + scrollTop + "px")
                        .removeClass("sticky");
                  } else {
                    $(".js-sticky-header")
                        .css("margin-top", -55)
                        .addClass("sticky");
                  }
                })
              };

              this.Page();
              this.SetChartData();
              this.LoadFilters();
              // seting sizes table data
              this.LoadConfig(sizesTableConfig);
              this.SizesTableData = this.SetCustomTableData(this.Fillters);
              // seting first elemetn and showing only new results
              this.Sort(this.SizesTableData, 'Name');
              this.SizesTableData = [this.SizesTableData.pop()]
              this.SizesTableLabels = this.GetTableLabels(this.SizesTableData);
              this.ClearFilters();
              // seting main table data
              this.LoadConfig(localStorage === undefined || localStorage.getItem(localStorageSettingsKey) == null ? defaultConfig : JSON.parse(localStorage.getItem(localStorageSettingsKey)));
              this.TableData = this.SetCustomTableData(this.Fillters);
              this.TableLabels = this.GetTableLabels(this.TableData);
              this.uiStickyElements();

              this.GetKeys = SpeedTestService.GetKeys;
            }]).directive('compileHtml', ['$compile', function($compile) {
              return function(scope, elem, attrs) {
                var html = attrs.compileHtml;
                var el = angular.element(html),
                    compiled = $compile(el);
                elem.append(el);
                compiled(scope);
              };
            }]);

(function filterDialog() {
  var $openFilterBtn = $('.js-open-filter'),
      $filterContainer = $('.js-data-table-filter');

  $openFilterBtn.on('click', function () {
    $filterContainer.addClass('visible');
  });

  $(document).on('click', function (e) {
    if (!$filterContainer.add($openFilterBtn).is(e.target) && $filterContainer.has(e.target).length === 0) {
      $filterContainer.removeClass('visible');
    }
  });
})();
