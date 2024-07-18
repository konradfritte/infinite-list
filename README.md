# Infinite List

This  is a personal project to help me keep track of things I need or want to do. It is very common for me to postpone ideas or to-dos to a later time, just to forget  them immediately afterward. Normal people probably use to-do lists as memory aids to overcome this issue. For some reason, however, they do not work for me. They soon become too large for me to actually oversee them. This is the point where I stop maintaining them properly, and eventually neglect them completely.

To help me get a better grip of my to-dos, I adopted a review schedule, using exponential back-off. It is somewhat inspired by Spaced Repetition tools (Anki, SuperMemo, Writing Inboxes). The mechanism is quite simple:
- You add all sort of new ideas to your infinte list.
- Each day, you get to review your infinite list: For each item, you can decide whether you want to schedule or postpone it.
- Each time you postpone an item, it's review interval is increased (doubled). Each time you schedule an item, its review interval is reset again.
Therefore, you can (ideally) add a very large amount of entries to your list and will still be able to oversee all of them. Relevant items will be shown in the near future. Irrelevant things however will be postponed to the very far future.

Currently, the app runs on the client-side only. All user data is stored in a browser IndexedDB database. Together with a service worker, this enables (experimental) PWA support. However, data is not synchronized across multiple devices. Additionally, all of your data is at risk if you clear your browser data/cache. Therefore, I added a basic import and export mechanism. I acknowledge, however, that this is a bit cumbersome in the long run.

A deployed app is available [here](https://konradfritte.github.io/infinite-list/). If you want to run and modify it locally, you can follow the instructions below. Feel free to leave some feedback about improvements or further ideas.


## Local Setup

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 18.0.4. Make sure to have it installed along with a current node version.

After cloning, run `yarn` or `npm install`.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
