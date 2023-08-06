import PySimpleGUI as sg


class ComboPopUp(sg.Window):
    def __init__(
        self,
        name: str,
        options: [],
        default_values: [] = None,
        icon: str = None,
        fit_size=False,
        search_bar=True,
    ):
        size = (20, 5)
        expand_y = False
        if fit_size:
            size = (None, None)
            expand_y = True

        self.options = options
        self.layout = [
            [
                sg.Input(
                    size=(20, 1),
                    enable_events=True,
                    key="-INPUT-",
                    expand_x=True,
                    border_width=0,
                )
            ],
            [
                sg.Listbox(
                    values=options,
                    size=size,
                    key="listboxpopup",
                    enable_events=True,
                    select_mode=sg.SELECT_MODE_SINGLE,
                    default_values=default_values,
                    no_scrollbar=True,
                    expand_x=True,
                    expand_y=expand_y,
                )
            ],
            [
                sg.Button(
                    "Accept", expand_x=True, pad=(3, 3), font=("Segoe UI", 15, "bold")
                ),
                sg.Button(
                    "Cancel", expand_x=True, pad=(3, 3), font=("Segoe UI", 15, "bold")
                ),
            ],
        ]
        if not search_bar:
            self.layout.pop(0)

        super().__init__(
            name,
            self.layout,
            disable_close=False,
            return_keyboard_events=True,
            keep_on_top=True,
            font=("Segoe UI", 15, ""),
            margins=(0, 0),
            icon=icon,
        )
        self.selected = []

    def get(self) -> []:
        self.input_length = 0
        while True:
            self.event, self.com_values = self.read()
            if self.event in (sg.WIN_CLOSED, "Exit"):
                break

            if self.event == "Cancel":
                break

            if self.event == "Accept" or self.event == "\r":
                projects = self.com_values["listboxpopup"]
                if projects is None:
                    projects = []
                self.close()

                return projects

            if self.event == "listboxpopup":
                self.selected = self.com_values["listboxpopup"]

            elif self.event == "-INPUT-":
                if (
                    self.com_values["-INPUT-"] != ""
                ):  # if a keystroke entered in search field
                    search = self.com_values["-INPUT-"].lower()
                    new_values = [
                        x for x in self.options if search in x.lower()
                    ]  # do the filtering
                    selected = [x for x in self.selected if x in new_values]
                    self["listboxpopup"].update(new_values)  # display in the listbox
                    self["listboxpopup"].set_value(selected)

                else:
                    # display original unfiltered list
                    self["listboxpopup"].update(self.options)
                    self["listboxpopup"].set_value(self.selected)

        self.close()
        return []


class ChatTab(sg.Tab):
    def __init__(self):
        # Multiline for Chat to display messages which will be disabled
        # Input for entering chat commands
        layout = [
            [
                sg.Multiline(
                    default_text="",
                    size=(50, 20),
                    disabled=True,
                    key="Chat",
                    expand_x=True,
                    expand_y=True,
                )
            ],
            [
                sg.Multiline(
                    key="Input", expand_x=True, no_scrollbar=True, size=(45, 2)
                ),
                sg.Button("Send", expand_y=False),
            ],
        ]
        super().__init__("Chat", layout)


class MainWindow(sg.Window):
    # Initiliaze the window
    def __init__(self):
        # Theme
        sg.theme("Dark2")

        # Font
        sg.DEFAULT_FONT = ("Segoe UI", 13, "")

        # Selected company
        self.selected_company = ""

        tab_layout = [[ChatTab()]]

        layout = [
            [
                [sg.Button("Company"), sg.Text(self.selected_company, key="Company_text")],
                sg.TabGroup(
                    tab_layout, expand_x=True, expand_y=True, focus_color="clear"
                ),
            ]
        ]

        super().__init__(
            "PDF Analyzer",
            layout,
            resizable=True,
            element_justification="left",
            font=sg.DEFAULT_FONT,
        )

    # Runs the window
    def run(self):
        while True:
            event, values = self.read()
            if event == sg.WIN_CLOSED:
                break

            elif event == "Company":
                company = ComboPopUp("Company", ["Company 1", "Company 2", "Company 3"]).get()
                if company:
                    self.selected_company = company[0]
                    self["Company_text"].update(self.selected_company)

            elif event == "Send":
                input = values["Input"]
                if input:
                    # Update the Chat multiline with red text color when user inputs
                    self["Chat"].update(input + "\n", append=True)
                    self["Input"].update("")

        self.close()


MainWindow().run()
