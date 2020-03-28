import { createStore, createEvent } from "effector";

export const codeChanged = createEvent();
export const $input = createStore(
  `
<template data-j-component="base-page" data-j-props="userName articleHeader time">
  <h1>user: {userName}</h1>
  <img src="./some-path.jpg" alt="{userName} photo" >
  <user-param key="height" value="123"></user-param>
  <user-param key="weight" value="67"></user-param>
  <div>
    <h2>Atricles</h2>
    <acticle>
      <h3>{articleHeader} <a href='/'>home</a></h3>
      <p>{articleHeader}</p>
      <user-param key="atricle data" value={time}></user-param>
    </acticle>
    <br />
  </div>
  <style>
    .red {
    color: red;
    }
  </style>
</template>
`.trim()
);
export const $validationOutput = createStore("-");

$input.on(codeChanged, (_, e) => e.target.value);