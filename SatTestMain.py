from sattracker.satpass import SatPass
from sattracker.satinterpolation import SatInterpolation
from sattracker.satserial import SatSerial


def main():
    sat_pass = SatPass(307.21, 13.08, 1521368025,
                       225.45, 78.27, 1521368345,
                       132.82, 0, 1521368660)
    sat_interpolation = SatInterpolation(sat_pass)
    sat_path = sat_interpolation.interp_satellite_path(20)
    print(sat_path)

    serial = SatSerial()
    serial.connect()
    serial.send_ping_command()
    serial.send_got_command(25,30,25)
    print(serial.receive())
    serial.close()


main()
