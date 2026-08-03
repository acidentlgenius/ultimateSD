import sys

filepath = 'ultimate-sd/src/components/__tests__/BlockchainDemo.test.tsx'

with open(filepath, 'r') as f:
    content = f.read()

test_case = """  it('clears previous mining interval if another block starts mining', async () => {
    const setIntervalSpy = vi.spyOn(global, 'setInterval');
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

    const { unmount } = render(<BlockchainDemo />);

    const addButton = screen.getByText('Add New Block');
    fireEvent.click(addButton);

    const buttons = screen.getAllByRole('button');
    const mineButton1 = buttons[1];
    const mineButton2 = buttons[2];

    fireEvent.click(mineButton1);

    // Wait for the first interval to start
    await waitFor(() => {
        expect(setIntervalSpy).toHaveBeenCalled();
    });

    fireEvent.click(mineButton2);

    expect(clearIntervalSpy).toHaveBeenCalled();

    unmount();
  });
"""

# Find the last '});' and insert the test case before it.
last_index = content.rfind('});')
if last_index != -1:
    new_content = content[:last_index] + test_case + content[last_index:]
    with open(filepath, 'w') as f:
        f.write(new_content)
    print("Modification complete.")
else:
    print("Could not find '});' to append to.")
