import './style.css'
import * as THREE from "three";
import './main'

const button = document.createElement("BUTTON");
button.innerHTML = "CLICK ME";
document.body.appendChild(button);

document.addEventListener("click", function (e) {
  if (e.target === button) {
    console.log("BUTTON PRESSED!!!");
  }
});
