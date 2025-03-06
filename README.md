[alpine.js](https://alpinejs.dev) 찍먹 - https://edp1096.github.io/hello-alpinejs

* Calendar source - https://github.com/bennadel/JavaScript-Demos/tree/master/demos/calendar-alpinejs
* Component - shadowDOM에서 js 샌드박스 안된다. 관심두지 말것.
* Bundler - 카운터 예제
```sh
cd bundle
yarn
yarn watch
# or
yarn build
```


## 메모
* x-data : 컨테이너에 삽입되는 렌더링용 데이터
* x-ref : `$ref.변수`. 단일 변수만, 배열형태 안됨
* x-text : `$ref.변수`의 내용을 `innerText`에 삽입

* @click : 클릭 이벤트

* $refs: `x-ref`로 선언되는 변수들
* $el: 이벤트 발생시의 해당 엘리먼트 (v3)
* $root: `x-data` 컨테이너
