# The KicsyDell API guide and reference
## What it is?
The KicsyDell API (KD namespace) are intended to use javascript language to manage
UI and data logic as well.
## Philosophy
Loading the API on HTML or PHP file, executing over the browser interpreting javascript.
KD helps to make a simple *user interface* and manage it's properties and showing 
data. User can perform some actions and retrieve information for server or send new information as well.
There are windows objects ({@link KDWindow}) to show visuals components.
Therefore messaging could be broadcast thrugh {@link KDMessage} class.
## Implementation
Write on your HTML file this code:
`<script src="KD.js"></script>`
If you want open inmediatly the terminal app (KDTerminalApp) could send a message to 
the kernel on this way:
` [kdKernel]{@link KDKernel}.{@link sendLocalMessage}({@link kdMessage}("terminal"));`