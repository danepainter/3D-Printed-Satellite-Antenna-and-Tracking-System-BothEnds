class SatPass:
    """Contains satellite pass data

    Attributes:
            startAz:
                Satellite azimuth for the start of this pass
            startEl:
                Satellite elevation for the start of this pass
            startUTC:
                Unix time for the start of this pass
            maxAz:
                Satellite azimuth for the max elevation of this pass
            maxEl:
                Satellite max elevation for this pass
            maxUTC:
                Unix time for the max elevation of this pass
            endAz:
                Satellite azimuth for the end of this pass
            endEl:
                Satellite elevation for the end of this pass
            endUTC:
                Unix time for the end of this pass

    """
    def __init__(self, startAz: float, startEl: float, startUTC: int,
                 maxAz: float, maxEl: float, maxUTC: int,
                 endAz: float, endEl: float, endUTC: int):
        """Initializes instance with satellite pass data details

        Args:
            startAz:
                Satellite azimuth for the start of this pass
            startEl:
                Satellite elevation for the start of this pass
            startUTC:
                Unix time for the start of this pass
            maxAz:
                Satellite azimuth for the max elevation of this pass
            maxEl:
                Satellite max elevation for this pass
            maxUTC:
                Unix time for the max elevation of this pass
            endAz:
                Satellite azimuth for the end of this pass
            endEl:
                Satellite elevation for the end of this pass
            endUTC:
                Unix time for the end of this pass
        """
        self.startAz = startAz
        self.startEl = startEl
        self.startUTC = startUTC
        self.maxAz = maxAz
        self.maxEl = maxEl
        self.maxUTC = maxUTC
        self.endAz = endAz
        self.endEl = endEl
        self.endUTC = endUTC
