import numpy as np


def _convert_to_python_values(times_num: np.ndarray, azs_num: np.ndarray, els_num: np.ndarray):
    """Converts numpy values to pythonic values

    Args:
        times_num:
            Numpy array of time data points
        azs_num:
            Numpy array of azimuth data points
        els_num:
            Numpy array of elevation data points

    Returns:
        A list of tuples containing the pythonic versions of the data points
    """
    python_times = [time.item() for time in times_num]
    python_azs = [az.item() for az in azs_num]
    python_els = [el.item() for el in els_num]
    return list(zip(python_azs, python_els, python_times))


def _round_data(azs_num: np.ndarray, els_num: np.ndarray, rounding_override: int = 0):
    """Rounds azimuth and elevation data points

    Args:
        azs_num:
            Numpy array of azimuth data points
        els_num:
            Numpy array of elevation data points
        rounding_override:
            An int representing to what decimal place should the points be rounded.
            0 is whole number rounding and >0 equates to decimal places

    Returns:
        Two numpy arrays of rounded azimuth and elevation data points
    """
    if rounding_override != 0:
        azs_rounded = np.round(azs_num, rounding_override)
        els_rounded = np.round(els_num, rounding_override)
        return azs_rounded, els_rounded
    return np.round(azs_num), np.round(els_num)


class SatInterpolation:
    """Handles the path interpolation of a satellite

    Attributes:
        pass_data:
            A sat_pass object containing satellite pass data
    """
    def __init__(self, pass_data):
        """Initializes instance with satellite pass data object

        Args:
            pass_data:
                A SatPass object containing satellite pass data
        """
        self.pass_data = pass_data

    def interp_satellite_path(self, interpolation_second_steps: int = 1, rounding_override: int = 0):
        """Interpolates the satellite path

        Args:
            interpolation_second_steps:
                An int representing how often to interpolate the path
            rounding_override:
                An int representing to what decimal place should the points be
                rounded. 0 is whole number rounding and >0 equates to decimal places

        Returns:
            A list of interpolated data points that have been rounded and
            converted to pythonic values
        """
        t0, tm, t1 = self.pass_data.startUTC, self.pass_data.maxUTC, self.pass_data.endUTC  # get times
        key_t = np.array([t0, tm, t1], dtype=float)

        # converts az from degrees to radians
        az_deg = np.array([self.pass_data.startAz, self.pass_data.maxAz, self.pass_data.endAz], dtype=float)
        az_rad = np.radians(az_deg)
        az_rad_unwrapped = np.unwrap(az_rad)  # handles data bigger than 360 deg/2pi rad

        el = np.array([self.pass_data.startEl, self.pass_data.maxEl,
                       self.pass_data.endEl], dtype=float)  # get elevations

        times = np.arange(t0, t1 + 1, interpolation_second_steps).astype(float)  # sample times (UTC seconds)

        # interpolate in radians for az, degrees for el
        az_interp_rad = np.interp(times, key_t, az_rad_unwrapped)
        el_interp_deg = np.interp(times, key_t, el)

        # convert az back to degrees for serial
        az_interp_deg = (np.degrees(az_interp_rad) + 360.0) % 360.0

        az_interp_deg, el_interp_deg = _round_data(az_interp_deg, el_interp_deg, rounding_override)
        times = [(time-times[max(0,i-1)]) * 1000 for i,time in enumerate(times)] #convert second timestamps to millisecond time deltas

        print(times)
        return _convert_to_python_values(times, az_interp_deg, el_interp_deg)

