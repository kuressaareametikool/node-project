var words = ["diaphanous","salacious","chiasmus","demagogue","temerity","aberration","corpulence","exacerbate","linchpin","obfuscate","descend","lozenge","ancestor","soothe","vantage","reciept","chiseled","possible","eternity","plastic","affect","amount","market","cook","under","break","habit","babies","poorly","token","hard","timpani",];

var gs = 0;

var ceword = "";

var blank = "";

var guessed = [];

var burple = 0;

function include(arr, obj) {
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] == obj) return true;
  }
}

function generate() {
  newblank = "";
  guessed = [];
  document.getElementById("guessed").innerHTML = guessed;
  blank = "";
  var current = Math.floor(Math.random() * 32);
  ceword = words[current];
  gs = 0;
  gs = 1 + ceword.length;
  document.getElementById("guesses").innerHTML = gs;
  for (var i = 0; i < ceword.length; i++) {
    blank = blank + "_";
  }
  document.getElementById("word").innerHTML = blank;
}

function same() {
  for (var i = 0; i < ceword.length; i++) {
    if (g === ceword[i]) {
      blank[2 * i - 1] = g;
    }
  }
  document.getElementById("word").innerHTML = "apple";
}

function guess() {
  document.getElementById("lose").innerHTML = "";
  var newblank = "";
  var g = document.getElementById("guess").value;
  document.getElementById("lose").innerHTML = "";
  document.getElementById("nope").innerHTML =
        "";
  var alphabet = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']
  if (include(alphabet,g) != true) {
    document.getElementById("nope").innerHTML = "Please enter a letter.";
    return;
  }
  var pre = "False";
  for (var i = 0; i < guessed.length; i++) {
    if (guessed[i] == g) {
      document.getElementById("nope").innerHTML =
        "Please enter a different letter.";
      pre = "True";
      console.log("duplicate letter")
    }
  }
  if (pre == "False") {
    guessed.push(g);
    document.getElementById("guessed").innerHTML = guessed;
    gs -= 1;
  }
  burple += 1;
  console.log(burple + " total guesses");
  var success = 0;
  for (var i = 0; i < ceword.length; i++) {
    if (include(guessed, ceword[i])) {
      newblank = newblank + ceword[i];
    } else if (ceword[i] == g) {
      newblank = newblank + g;
    } else if (newblank[i] != "_") {
      newblank = newblank + "_";
    }
  }
  var cewordArray = ceword.split("");
  for (var i = 0; i < ceword.length; i++) {
    if (include(cewordArray,g)) {
      success = 1;
    }
  }
  if (success == 1 && pre == "False") {
    gs += 1;
  }
  document.getElementById("guesses").innerHTML = gs;
  document.getElementById("word").innerHTML = newblank;
  if (newblank == ceword) {
    document.getElementById("lose").innerHTML = "You win!";
    generate();
  } else if (gs == 0) {
    document.getElementById("lose").innerHTML = "You lose!";
    generate();
  }
}
