(ns two.test
  (:require [two.test.hello :as hello]))

(def success 0)

(defn ^:export run []
  (.log js/console "Example test started")
  (hello/run)
  success)

