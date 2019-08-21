import React, { SFC } from 'react';
import compose from 'recompose/compose';
import get from 'lodash/get';
import pure from 'recompose/pure';
import Chip, { ChipProps } from '@material-ui/core/Chip';
import { makeStyles } from '@material-ui/core/styles';
import classnames from 'classnames';

import sanitizeRestProps from './sanitizeRestProps';
import { FieldProps, InjectedFieldProps, fieldPropTypes } from './types';

const useStyles = makeStyles({
    chip: { margin: 4 },
});

export const ChipField: SFC<FieldProps & InjectedFieldProps & ChipProps> = ({
    className,
    source,
    record = {},
    ...rest
}) => {
    const classes = useStyles({});

    return (
        <Chip
            className={classnames(classes.chip, className)}
            label={get(record, source)}
            {...sanitizeRestProps(rest)}
        />
    );
};

const EnhancedChipField = compose<
    FieldProps & InjectedFieldProps & ChipProps,
    FieldProps & ChipProps
>(pure)(ChipField);

EnhancedChipField.defaultProps = {
    addLabel: true,
};

EnhancedChipField.propTypes = {
    ...ChipField.propTypes,
    ...fieldPropTypes,
};

EnhancedChipField.displayName = 'EnhancedChipField';

export default EnhancedChipField;
