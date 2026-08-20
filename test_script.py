import sys
from html.parser import HTMLParser

class ResourceParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_resource_list = False
        self.div_depth = 0
        self.found_cards = []
        self.current_card = None
        self.tag_stack = []

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        if self.in_resource_list:
            if tag == "div":
                self.div_depth += 1
            if tag == "a" and attrs_dict.get("class") == "resource-item":
                self.current_card = {
                    "attrs": attrs_dict,
                    "text_parts": []
                }
                self.tag_stack.append("a")
            elif self.current_card:
                self.tag_stack.append(tag)
        else:
            if tag == "div" and attrs_dict.get("class") == "resource-list":
                self.in_resource_list = True
                self.div_depth = 1

    def handle_endtag(self, tag):
        if self.in_resource_list:
            if self.current_card:
                if self.tag_stack:
                    popped = self.tag_stack.pop()
                    if popped == "a" and not self.tag_stack:
                        self.found_cards.append(self.current_card)
                        self.current_card = None
            if tag == "div":
                self.div_depth -= 1
                if self.div_depth == 0:
                    self.in_resource_list = False

    def handle_data(self, data):
        if self.in_resource_list and self.current_card:
            stripped = data.strip()
            if stripped:
                self.current_card["text_parts"].append(stripped)

with open("index.html", "r", encoding="utf-8") as f:
    html_content = f.read()

parser = ResourceParser()
parser.feed(html_content)

if not parser.found_cards:
    print("Error: No cards (a.resource-item) found inside div.resource-list.", file=sys.stderr)
    sys.exit(1)

print(f"Found {len(parser.found_cards)} resource items inside div.resource-list.")

first_card = parser.found_cards[0]
first_card_id = first_card["attrs"].get("id")
first_card_text = " ".join(first_card["text_parts"])

print(f"First card details:")
print(f"  ID: {first_card_id}")
print(f"  Text: {repr(first_card_text)}")

if first_card_id \!= "exercicios":
    print(f"Error: First card ID is {repr(first_card_id)}, expected "exercicios".", file=sys.stderr)
    sys.exit(2)

if "Curso · Plano geral" not in first_card_text:
    print(f"Error: First card text does not contain "Curso · Plano geral". Actual text: {repr(first_card_text)}", file=sys.stderr)
    sys.exit(3)

matching_cards = []
for card in parser.found_cards:
    card_id = card["attrs"].get("id")
    card_text = " ".join(card["text_parts"])
    if card_id == "exercicios" and "Curso · Plano geral" in card_text:
        matching_cards.append(card)

print(f"Found {len(matching_cards)} card(s) matching ID "exercicios" and text containing "Curso · Plano geral".")

if len(matching_cards) \!= 1:
    print(f"Error: Expected exactly 1 matching card, found {len(matching_cards)}.", file=sys.stderr)
    sys.exit(4)

print("All validations passed successfully\!")
sys.exit(0)
