(defproject two "1.0.0-SNAPSHOT"
            :description "FIXME: write description"
            :source-path "src-clj"
            :dependencies [[org.clojure/clojure "1.4.0"]
                           [compojure "1.0.4"]
                           [hiccup "1.0.0"]]
            :dev-dependencies [[lein-ring "0.7.0"]]
            :plugins [[lein-cljsbuild "0.2.1"]]
            :hooks [leiningen.cljsbuild]
            :cljsbuild 
            { :repl-listen-port 9000
             :repl-launch-commands
             {"firefox" ["firefox"
                         :stdout ".repl-firefox-out"
                         :stderr ".repl-firefox-err"]
              "firefox-naked" ["firefox"
                               "resources/private/html/naked.html"
                               :stdout ".repl-firefox-naked-out"
                               :stderr ".repl-firefox-naked-err"]
              "phantom" ["phantomjs"
                         "phantom/repl.js"
                         :stdout ".repl-phantom-out"
                         :stderr ".repl-phantom-err"]
              "phantom-naked" ["phantomjs"
                               "phamtom/repl.js"
                               "resources/private/html/naked.html"
                               :stdout ".repl-phantom-naked-out"
                               :stderr ".repl-phantom-naked-err"]}
             :test-commands
             {"unit" ["phantomjs"
                      "phantom/unit-test.js"
                      "resources/private/html/unit-test.html"]}
             ;:crossovers [two.crossover]
             ;:crossover-jar true
             :builds
             {:dev {:source-path "src-cljs"
                    :jar true
                    :compiler {:output-to "resources/public/js/main-debug.js"
                               :optimizations :whitespace
                               :pretty-print true}}
              :prod {:source-path "src-cljs"
                     :compiler {:output-to "resources/public/js/main.js"
                                :optimizations :advanced
                                :pretty-print false}}
              :test {:source-path "test-cljs"
                     :compiler {:output-to "resources/private/js/unit-test.js"
                                :optimizations :whitespace
                                :pretty-print true}}}}
            :ring {:handler two.routes/app})

