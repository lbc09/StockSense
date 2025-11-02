# This section outlines the steps to set up and run the StockSense application environment locally using VS Code and your operating system's terminal.

Prerequisites
You must have the following software installed on your machine:

- **Node.js** (v18 or higher recommended)

- __npm__ (Node Package Manager, installed with Node.js)

- __Git__ (For cloning the repository and managing code versions)

- __VS Code__ (Optional, but recommended for development)



## Step 1: Clone the Repository
Open your terminal (or VS Code's integrated terminal), navigate to the folder where you keep your projects, and run:

~~~
# Clone the repository from GitHub
git clone https://github.com/lbc09/StockSense.git

# Navigate into the project directory
cd StockSense
~~~

## Step 2: Install Dependencies
The project relies on Express, SQLite3, and other packages listed in package.json.

~~~
npm install
~~~
This command installs all necessary dependencies, including express, bcryptjs, and sqlite3.

## Step 3: Run the Program
You can start the server using the script defined in your package.json.
~~~
npm start
~~~
## Output and Verification:

The console will display: Connected to SQLite database.

The console will display: 🚀 StockSense server running on http://localhost:5000.

The application will automatically create the stocksense.db file and populate the initial users, products, and sample sales history (August - November 2025).

## Step 4: Access the Application
Open your web browser and go to the local address:
~~~
http://localhost:5000
~~~
You can now log in using the following demo accounts to test different roles:
~~~
Role,ID Number,Password
Manager,MGR001,manager123
Staff,STAFF001,staff123
Admin,ADMIN001,admin123
~~~


