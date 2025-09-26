import numpy as np


def convert_to_python_values(times_num, azs_num, els_num):
    python_times = [time.item() for time in times_num]
    python_azs = [az.item() for az in azs_num]
    python_els = [el.item() for el in els_num]
    return list(zip(python_azs, python_els, python_times))


def round_data(azs_num, els_num, rounding_override=0):
    if rounding_override != 0:
        azs_rounded = np.round(azs_num, rounding_override)
        els_rounded = np.round(els_num, rounding_override)
        return azs_rounded, els_rounded
    return np.round(azs_num), np.round(els_num)


class SatInterpolation:
    def __init__(self, pass_data):
        self.pass_data = pass_data

    def interp_satellite_path(self, interpolation_second_steps=1, rounding_override=0):
        # get times
        t0, tm, t1 = self.pass_data.startUTC, self.pass_data.maxUTC, self.pass_data.endUTC
        key_t = np.array([t0, tm, t1], dtype=float)

        # convert az from degrees to radians
        az_deg = np.array([self.pass_data.startAz, self.pass_data.maxAz, self.pass_data.endAz], dtype=float)
        az_rad = np.radians(az_deg)
        az_rad_unwrapped = np.unwrap(az_rad)  # handles data bigger than 360 deg/2pi rad

        # get elevations
        el = np.array([self.pass_data.startEl, self.pass_data.maxEl, self.pass_data.endEl], dtype=float)

        # sample times (UTC seconds)
        times = np.arange(t0, t1 + 1, interpolation_second_steps).astype(float)

        # interpolate in radians for az, degrees for el
        az_interp_rad = np.interp(times, key_t, az_rad_unwrapped)
        el_interp_deg = np.interp(times, key_t, el)

        # convert az back to degrees for serial
        az_interp_deg = (np.degrees(az_interp_rad) + 360.0) % 360.0

        az_interp_deg, el_interp_deg = round_data(az_interp_deg, el_interp_deg, rounding_override)
        return convert_to_python_values(times, az_interp_deg, el_interp_deg)

