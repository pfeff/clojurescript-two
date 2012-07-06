(ns two.hello)

(defn ^:export say-hello []
  (js/alert "Hello world!"))

(defn add-some-numbers [& numbers]
  (apply + numbers))

