'use strict';

/////////////////////////////////////////////////
/////////////////////////////////////////////////
// BANKIST APP

/////////////////////////////////////////////////
// Data
// Login Data: js | 1111, jd | 2222
/*
Pretend that all these data is coming from a Web API:
  📌 Whenever we get data from an API, the data usually comes in a form of ❗️Objects (JSON format)
*/
//When the page re-loads, all the data will be reset to these hard codes (bc this static web hasn't had a database yet)

// DIFFERENT DATA! Contains movement dates, currency and locale
const account1 = {
  owner: 'Jonas Schmedtmann',
  movements: [200, 455.23, -306.5, 25000, -642.21, -133.9, 79.97, 1300],
  interestRate: 1.2, // %
  pin: 1111,

  movementsDates: [
    '2019-11-18T21:31:17.178Z',
    '2019-12-23T07:42:02.383Z',
    '2020-01-28T09:15:04.904Z',
    '2020-04-01T10:17:24.185Z',
    '2020-05-08T14:11:59.604Z',
    '2020-07-26T17:01:17.194Z',
    '2020-07-28T23:36:17.929Z',
    '2020-08-01T10:51:36.790Z',
  ],
  currency: 'EUR',
  locale: 'pt-PT', // de-DE
};

const account2 = {
  owner: 'Jessica Davis',
  movements: [5000, 3400, -150, -790, -3210, -1000, 8500, -30],
  interestRate: 1.5,
  pin: 2222,

  movementsDates: [
    '2019-11-01T13:15:33.035Z',
    '2019-11-30T09:48:16.867Z',
    '2019-12-25T06:04:23.907Z',
    '2020-01-25T14:18:46.235Z',
    '2020-02-05T16:33:06.386Z',
    '2020-04-10T14:43:26.374Z',
    '2020-06-25T18:49:59.371Z',
    '2020-07-26T12:01:20.894Z',
  ],
  currency: 'USD',
  locale: 'en-US',
};

const accounts = [account1, account2];
let currentAccount, timer;

/////////////////////////////////////////////////
// Elements
const labelWelcome = document.querySelector('.welcome');
const labelDate = document.querySelector('.date');
const labelBalance = document.querySelector('.balance__value');
const labelSumIn = document.querySelector('.summary__value--in');
const labelSumOut = document.querySelector('.summary__value--out');
const labelSumInterest = document.querySelector('.summary__value--interest');
const labelTimer = document.querySelector('.timer');

const containerApp = document.querySelector('.app');
const containerMovements = document.querySelector('.movements');

const btnLogin = document.querySelector('.login__btn');
const btnTransfer = document.querySelector('.form__btn--transfer');
const btnLoan = document.querySelector('.form__btn--loan');
const btnClose = document.querySelector('.form__btn--close');
const btnSort = document.querySelector('.btn--sort');

const inputLoginUsername = document.querySelector('.login__input--user');
const inputLoginPin = document.querySelector('.login__input--pin');
const inputTransferTo = document.querySelector('.form__input--to');
const inputTransferAmount = document.querySelector('.form__input--amount');
const inputLoanAmount = document.querySelector('.form__input--loan-amount');
const inputCloseUsername = document.querySelector('.form__input--user');
const inputClosePin = document.querySelector('.form__input--pin');

/////////////////////////////////////////////////
// Functions

/**
 * @brief format Date & Time for movements based on user's locale
 *
 * @param {Date} date
 * @param {String} locale
 *
 * @returns {Intl.DateTimeFormat}
 */
const formatMovementDate = function (date, locale) {
  const calcDaysPassed = (date1, date2) =>
    Math.round(Math.abs(date2 - date1) / (1000 * 60 * 60 * 24));

  const daysPassed = calcDaysPassed(new Date(), date);
  console.log(daysPassed);

  if (daysPassed === 0) return 'Today';
  if (daysPassed === 1) return 'Yesterday';
  if (daysPassed <= 7) return `${daysPassed} days ago`;

  // const day = `${date.getDate()}`.padStart(2, 0);
  // const month = `${date.getMonth() + 1}`.padStart(2, 0);
  // const year = date.getFullYear();
  // return `${day}/${month}/${year}`;
  // console.log(typeof Intl.DateTimeFormat(locale).format(date)); //String
  return new Intl.DateTimeFormat(locale).format(date);
};

const formatCur = function (value, locale, currency) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    // useGrouping: false,
  }).format(value);
};

/**
 * @brief Display movements of the current account
 *
 * @param {Object} acc - the current user account
 * @param {Boolean} sort
 */
//set default 'sort' parameter = false
const displayMovements = function (acc, sort = false) {
  //__👉 use ✨innerHTML property to REPLACE ALL content inside of movements container
  containerMovements.innerHTML = ``;

  /*__👉 SORT user account's movements in ASC order ❗️but will be displayed in DESC because of ✨insertAdjacentHTML('afterbegin', ...) Method
  [👍 use ✨slice() Method to make a shallow copy of 'movements' Array, so that the original Array 
  won't be mutated when sorting]*/
  const movs = sort
    ? acc.movements.slice().sort((a, b) => a - b)
    : acc.movements;

  movs.forEach(function (mov, i) {
    const type = mov > 0 ? 'deposit' : 'withdrawal';

    //__👉 create a new ✨date object for each date string of the current account
    const date = new Date(acc.movementsDates[i]);
    const displayDate = formatMovementDate(date, acc.locale);

    const formattedMov = formatCur(mov, acc.locale, acc.currency);

    const movRowHtml = `
      <div class="movements__row">
        <div class="movements__type movements__type--${type}">${
      i + 1
    } ${type}</div>
        <div class="movements__date">${displayDate}</div>
        <div class="movements__value">${formattedMov}</div>
      </div>
    `;

    //❗️NEWEST ele (transaction) is on TOP
    containerMovements.insertAdjacentHTML('afterbegin', movRowHtml);
  });
};

/**
 * @brief calculate & add balance for each account owner - display balance labels accordingly
 *
 * @param {Object} acc - the current user account
 */
const calcDisplayBalance = function (acc) {
  acc.balance = acc.movements.reduce((acc, mov) => acc + mov, 0);
  labelBalance.textContent = formatCur(acc.balance, acc.locale, acc.currency);
};

/**
 * @brief calculate & add summary for each account owner - display summary labels (in, out, interest) accordingly
 *
 * @param {Object} acc - the current user account
 */
const calcDisplaySummary = function (acc) {
  //chaining PIPELINE
  const incomes = acc.movements
    .filter(mov => mov > 0)
    .reduce((acc, mov) => acc + mov, 0);
  labelSumIn.textContent = formatCur(incomes, acc.locale, acc.currency);

  const out = acc.movements
    .filter(mov => mov < 0)
    .reduce((acc, mov) => acc + mov, 0);
  labelSumOut.textContent = formatCur(Math.abs(out), acc.locale, acc.currency);

  //👩‍🎓 sum interest = 1.2% of sum income = sum(1.2% of EACH of the deposited amount)
  //❗️RULE: the bank only pays an iterest if that interest is at least 1 Euro/other currencies
  // acc.interest = acc.incomes * 0.012;
  const interest = acc.movements
    .filter(mov => mov > 0)
    .map(deposit => (deposit * acc.interestRate) / 100)
    .filter(interest => interest >= 1)
    .reduce((accumulator, interest) => accumulator + interest, 0);
  labelSumInterest.textContent = formatCur(interest, acc.locale, acc.currency);
};

/**
 * @brief compute & add usernames (composed of initial letters) for current account owner
 *
 * @param {Object} accs - the current user account
 */
const createUsernames = function (accs) {
  accs.forEach(function (acc) {
    acc.username = acc.owner
      .toLowerCase()
      .split(' ')
      .map(name => name[0])
      .join('');
  });
};
createUsernames(accounts);

/**
 * @brief update & display current User Info
 *
 * @param {Object} accs - the current user account
 */
const updateUI = function (acc) {
  // Display movements
  displayMovements(acc);

  // Display balance
  calcDisplayBalance(acc);

  // Display summary
  calcDisplaySummary(acc);
};

/*
🚔 For security reasons, real bank applications will log out users after some inactive time 
(e.g. after 5 minutes w/o doing anything) 
--> 👍 use ✨setInterval timer to fo this
*/
/**
 * @brief start counting down the logout time
 *
 * @returns - setInterval
 */
const startLogOutTimer = function () {
  const tick = function () {
    const min = String(Math.trunc(time / 60)).padStart(2, 0);
    const sec = String(time % 60).padStart(2, 0);

    // In each call, print the remaining time to UI
    labelTimer.textContent = `${min}:${sec}`;

    // When 0 seconds, stop timer and log out user
    if (time === 0) {
      clearInterval(timer);
      labelWelcome.textContent = 'Log in to get started';
      containerApp.style.opacity = 0;
    }

    // Decrease 1s
    time--;
  };

  // Set time to N minutes
  let time = 100; //✨in minutes (1 min 40 secs)

  //(🔥 TRICK)__👉 call ✨tick func so that the timer start counting down IMMEDIATELY right after login
  tick();
  //__👉 call the timer (✨tick callback func) ❗️AFTER EVERY second
  const timer = setInterval(tick, 1000);

  return timer;
};

///////////////////////////////////////
// Event handlers

// FAKE ALWAYS LOGGED IN
// currentAccount = account1;
// updateUI(currentAccount);
// containerApp.style.opacity = 100;

//Add Event handler to 'login button': pass into the event obj
btnLogin.addEventListener('click', function (e) {
  // Prevent form from submitting to retain the login state
  e.preventDefault();

  //__👉 find the account from the 'accounts' Array with the 'username' that the user inputted
  currentAccount = accounts.find(
    acc => acc.username === inputLoginUsername.value
  );
  console.log(currentAccount);

  //__👉 validate the PIN & check if user account exists
  if (currentAccount?.pin === Number(inputLoginPin.value)) {
    //__👉 Display UI and welcome message
    labelWelcome.textContent = `Welcome back, ${
      currentAccount.owner.split(' ')[0]
    }`;
    containerApp.style.opacity = 1;

    // Create current date and time
    const now = new Date();

    //configuration
    const options = {
      hour: 'numeric',
      minute: 'numeric',
      day: 'numeric',
      month: 'long', //other options: '2-digit', 'numeric'
      year: 'numeric',
      // weekday: 'long',
    };
    // const locale = navigator.language;
    // console.log(locale);

    /*
    [📆 use ✨internationalization (Intl) Lib API to form a date-time, currencies FORMAT according to ❗️the user's location]
    --> 📌 make our applications support different languages/locales (📚 check iso language code table for more)
    --> 📌 ✨Intl is the ✨namespace for the ✨internationalization API e
    */
    /*__👉 create a formatter for time & date according to locale:
      use [✨DateTimeFormat(<locale String>, opt: {options object}).format({Date object}/number)]
    */
    labelDate.textContent = new Intl.DateTimeFormat(
      currentAccount.locale,
      options
    ).format(now);

    //🔥__👉 get ✨locale from User's Browser
    // const userLocale = navigator.language;
    // console.log(userLocale); //en-US

    // const day = `${now.getDate()}`.padStart(2, 0);
    // const month = `${now.getMonth() + 1}`.padStart(2, 0);
    // const year = now.getFullYear();
    // const hour = `${now.getHours()}`.padStart(2, 0);
    // const min = `${now.getMinutes()}`.padStart(2, 0);
    // labelDate.textContent = `${day}/${month}/${year}, ${hour}:${min}`;

    //__👉 Clear input fields: ❗️both values & focused state
    //📌 the assignment operators work from RIGHT to LEFT
    inputLoginUsername.value = inputLoginPin.value = '';
    inputLoginPin.blur(); //[👍 use ✨blur Method to discard focus]

    //❗️RESET Timer: so that different timers in diff accounts don't get collided
    if (timer) clearInterval(timer);
    timer = startLogOutTimer();

    //__👉 Display current account info
    updateUI(currentAccount);
  }
});

/**
 * @bief to validate the transferation
 *
 * @param {Number} amount
 * @param {Object} bnfUser
 * @param {Object} curUser
 *
 * @returns {Boolean}
 */
const validateTransfer = function (amount, bnfUser, curUser) {
  return (
    amount > 0 &&
    bnfUser &&
    curUser.balance >= amount &&
    bnfUser?.username !== curUser.username
  );
};

//Add Event handler to 'transfer button': pass into the event obj
btnTransfer.addEventListener('click', function (e) {
  e.preventDefault();
  const transAmount = +inputTransferAmount.value;
  const receiverAcc = accounts.find(
    acc => acc.username === inputTransferTo.value
  );
  //__👉 Clear input fields: ❗️both values & focused state
  inputTransferAmount.value = inputTransferTo.value = '';
  inputTransferAmount.blur();

  if (validateTransfer(transAmount, receiverAcc, currentAccount)) {
    //__👉 doing the transfer
    currentAccount.movements.push(-transAmount);
    receiverAcc.movements.push(transAmount);

    //__👉 Add transfer date
    currentAccount.movementsDates.push(new Date().toISOString());
    receiverAcc.movementsDates.push(new Date().toISOString());

    //__👉 update UI
    updateUI(currentAccount);

    //__👉 Reset timer
    clearInterval(timer);
    timer = startLogOutTimer();
  }
});

/*
❗️RULE: ONLY grants a loan if there at least ✨ONE deposit 
with at least ✨10% of the requested amount
*/
/**
 * @bief to validate the conditions for loan request
 *
 * @param {Object} curUser
 * @param {Number} loanAmount
 * @param {Number} requiredRate
 *
 * @returns {Boolean}
 */
const validateLoan = function (curUser, loanAmount, requiredRate) {
  return (
    loanAmount > 0 &&
    curUser.movements
      .filter(mov => mov > 0)
      .some(deposit => deposit >= loanAmount * requiredRate)
  );
};

//Add Event handler to 'request loan button': pass into the event obj
btnLoan.addEventListener('click', function (e) {
  e.preventDefault();

  const loanAmount = Math.floor(inputLoanAmount.value);
  const requiredRate = 0.1;

  //__👉 validate requesting loan condition & update the deposit & UI
  if (validateLoan(currentAccount, loanAmount, requiredRate)) {
    setTimeout(function () {
      //__👉 add loan amount to movements
      currentAccount.movements.push(loanAmount);

      //__👉 Add loan date
      currentAccount.movementsDates.push(new Date().toISOString());

      //__👉 update UI
      updateUI(currentAccount);

      //__👉 Reset timer
      clearInterval(timer);
      timer = startLogOutTimer();

      alert('Request loan successfully!');
    }, 2500);
  } else {
    alert('Request failed!');
  }

  //__👉 Clear input fields: ❗️both values & focused state
  inputLoanAmount.value = '';
  inputLoanAmount.blur();
});

/**
 * @bief to validate the user credentials
 *
 * @param {Object} curUser
 * @param {String} userInput - the value USERNAME input of the closing account
 * @param {String} pinInput - the value PIN input of the closing account
 *
 * @returns {Boolean}
 */
const validateCredentials = function (curUser, userInput, pinInput) {
  return userInput === curUser.username && Number(pinInput) === curUser.pin
    ? true
    : false;
};

//Add Event handler to 'close button': pass into the event obj
btnClose.addEventListener('click', function (e) {
  e.preventDefault();

  //__👉 validate credentials & delete the account object from the 'account' Array
  if (
    validateCredentials(
      currentAccount,
      inputCloseUsername.value,
      inputClosePin.value
    )
  ) {
    //__👉 Delete account
    accounts.splice(
      accounts.findIndex(acc => acc.username === currentAccount.username),
      1
    );
    alert('Account closed!');

    //__👉 hide UI
    containerApp.style.opacity = 0;
  } else {
    alert('Wrong credentials!');
  }

  //__👉 Clear input fields: ❗️both values & focused state
  inputCloseUsername.value = inputClosePin.value = '';
  inputClosePin.blur();
});

let sorted = false;
//Add Event handler to 'sort button': pass into the event obj
btnSort.addEventListener('click', function (e) {
  e.preventDefault();
  //__👉 hold current 'sorted' value
  // sorted = sorted === true ? false : true;
  sorted = !sorted;
  displayMovements(currentAccount.movements, sorted);
});
