import string
import serial
import time

#port = "/dev/ttyUSB0"


class SatSerial:
    """Implements the serial interface for motor control communication

    Arguments:
        port:
            A string representation of serial port
        baudrate:
            An int of the serial baudrate
        timeout:
            An int of the serial timeout
        ser:
            A serial object
    """
    def __init__(self, port: string = "COM5", baudrate: int = 9600, timeout: int = 10):
        """Initializes instance with serial object and parameters

        Args:
            port:
                A string representation of serial port
            baudrate:
                An int of the serial baudrate
            timeout:
                An int of the serial timeout
        """
        self.port = port
        self.baudrate = baudrate
        self.timeout = timeout
        self.ser = None

        self.connect()
        self.send_ping_command()

    def connect(self):
        """Initializes serial connection and connects to port at specified baudrate

        Raises:
            SerialException: A connection error occurred
        """
        try:
            self.ser = serial.Serial(self.port, self.baudrate, timeout=self.timeout)
            time.sleep(2)
            print(f"Connected to {self.port} at {self.baudrate} baud.")
        except serial.SerialException as e:
            print(f"Connection error: {e}")
            self.ser = None

    def _send(self, data: str):
        """Send some data over serial

        Arg:
            data:
                A string that will be sent over serial
        """
        if self.ser and self.ser.is_open:
            self.ser.write((data + "\n").encode())
            print(f"Sent: {data}")
        else:
            print("Serial connection not open.")

    def send_interpolation_data(self, sat_path):
        """Send interpolation data over serial using GOT commands

        Args:
            sat_path:
                A list containing interpolation data points
        """
        interpolation_steps = sat_path[1][2] - sat_path[0][2]
        millisecond_time = int(interpolation_steps * 1000)
        for i in range(len(sat_path)-1):
            response = self.receive()
            while response != "ready":
                response = self.receive()
            self.send_got_command(int(sat_path[i][0]), int(sat_path[i][1]), millisecond_time)
            time.sleep(interpolation_steps-2)

    def send_got_command(self, alt_angle: int, az_angle: int, az_time: int):
        """Send the GOT command over serial

        Takes two angles and a time quantity and moves the altitude and azimuth to the specified angles over the
        specified period of time.

        Args:
            alt_angle:
                An int representing altitude angle
            az_angle:
                An int representing azimuth angle
            az_time:
                An int representing the specified time in milliseconds
        """
        self._send(f"GOT {alt_angle} {az_angle} {az_time}")

    def send_unstow_command(self):
        """Send the unstow command over serial

        Moves antenna from parked position to 0° position
        """
        self._send("UNSTOW")

    def send_stow_command(self):
        """Send the stow command over serial

        Stows antenna in parked position for safe shutoff without dropping antenna
        """
        self._send("STOW")

    def send_ping_command(self):
        """Send the ping command over serial

        Sends ping over serial and expects reply of pong. Used for testing serial link.

        Raise:
            SerialException: Pong response was not received. Connection not ready.
        """
        self._send("PING")
        response = self.receive()
        if response != "PONG":
            print("Serial connection is not ready")
            raise serial.SerialException("PONG response not received. Connection not ready.")
        else:
            print("PONG received. Serial connection is ready.")

    def send_saz_command(self, angle: int):
        """Send the saz command over serial

        Allows manually setting current azimuth with use of external compass.

        Args:
            angle: An int representing angle from external compass
        """
        self._send(f"SAZ {angle}")

    def receive(self):
        """Receive data over serial"""
        if self.ser and self.ser.is_open:
            return self.ser.readline().decode(errors="ignore").strip()
        else:
            print("Serial connection not open.")
            return None

    def close(self):
        """Close serial connection"""
        if self.ser and self.ser.is_open:
            self.ser.close()
            print("Serial connection closed.")

