import readline from "readline/promises";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  while (true) {
    const userInput = await rl.question("You: ");
    if (userInput.toLowerCase() === "bye") {
      break;
    }
    console.log(`You said: ${userInput}`);
  }
  rl.close();
}

main();
