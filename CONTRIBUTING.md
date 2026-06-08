# Contributing to DevForge

First off, thank you for considering contributing to DevForge! It's people like you that make DevForge such a great tool.

## Where do I go from here?

If you've noticed a bug or have a feature request, make one! It's generally best if you get confirmation of your bug or approval for your feature request this way before starting to code.

## Fork & create a branch

If this is something you think you can fix, then fork DevForge and create a branch with a descriptive name.

A good branch name would be (where issue #325 is the ticket you're working on):

```sh
git checkout -b 325-add-new-plugin
```

## Get the test suite running

1. Install dependencies:
   ```sh
   npm install
   ```
2. Build the project:
   ```sh
   npm run build
   ```
3. Run the CLI locally to test your changes:
   ```sh
   node dist/index.js
   ```

## Implement your fix or feature

At this point, you're ready to make your changes! Feel free to ask for help; everyone is a beginner at first.

## Make a Pull Request

At this point, you should switch back to your master branch and make sure it's up to date with DevForge's master branch:

```sh
git remote add upstream git@github.com:PuneethKrishnaS/design-backend-app.git
git checkout master
git pull upstream master
```

Then update your feature branch from your local copy of master, and push it!

```sh
git checkout 325-add-new-plugin
git rebase master
git push --set-upstream origin 325-add-new-plugin
```

Finally, go to GitHub and make a Pull Request!
