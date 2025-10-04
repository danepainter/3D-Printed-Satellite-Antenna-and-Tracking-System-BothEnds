import serial
import time

#port = "/dev/ttyUSB0"


class SatSerial:
    def __init__(self, port="COM5", baudrate=9600, timeout=10):
        self.port = port
        self.baudrate = baudrate
        self.timeout = timeout
        self.ser = None

    def connect(self):
        try:
            self.ser = serial.Serial(self.port, self.baudrate, timeout=self.timeout)
            time.sleep(2)
            print(f"Connected to {self.port} at {self.baudrate} baud.")
        except serial.SerialException as e:
            print(f"Connection error: {e}")
            self.ser = None

    def send(self, data):
        if self.ser and self.ser.is_open:
            self.ser.write((data + "\n").encode())
            print(f"Sent: {data}")
        else:
            print("Serial connection not open.")

    def send_got_command(self, alt_angle, az_angle, az_time):
        self.send(f"GOT {alt_angle} {az_angle} {az_time}")

    def send_unstow_command(self):
        self.send("UNSTOW")

    def send_stow_command(self):
        self.send("STOW")

    def send_ping_command(self):
        self.send("PING")
        response = self.receive()
        if response != "PONG":
            print("Serial connection is not ready")
            raise serial.SerialException("PONG response not received. Connection not ready.")
        else:
            print("PONG received. Serial connection is ready.")

    def send_saz_command(self, angle):
        self.send(f"SAZ {angle}")

    def receive(self):
        if self.ser and self.ser.is_open:
            return self.ser.readline().decode(errors="ignore").strip()
        else:
            print("Serial connection not open.")
            return None

    def close(self):
        if self.ser and self.ser.is_open:
            self.ser.close()
            print("Serial connection closed.")

